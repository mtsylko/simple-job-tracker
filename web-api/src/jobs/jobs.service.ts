import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { In, Repository } from 'typeorm';
import type {
  CreateJobInput,
  JobContractType,
  JobCustomFields,
  JobCv,
  JobEmploymentType,
  JobLevel,
  JobOutcome,
  JobRole,
  JobStatus,
  JobStatusColor,
  JobType,
  UpdateJobInput
} from '@job-tracker/shared';
import { apiError } from '../common/errors/api-error';
import { buildCustomFieldsSchema } from '../job-fields/build-custom-fields-schema';
import { JobContractTypesService } from '../job-contract-types/job-contract-types.service';
import { JobEmploymentTypesService } from '../job-employment-types/job-employment-types.service';
import { JobFieldsService } from '../job-fields/job-fields.service';
import { JobLevelsService } from '../job-levels/job-levels.service';
import { JobOutcomesService } from '../job-outcomes/job-outcomes.service';
import { JobRolesService } from '../job-roles/job-roles.service';
import { JobStatusesService } from '../job-statuses/job-statuses.service';
import { JobTypesService } from '../job-types/job-types.service';
import type { TaxonomyOptionEntity } from '../taxonomies/taxonomy-option.entity';
import { JobEntity } from './job.entity';
import { JobAttachmentsService } from './job-attachments.service';

export type Job = {
  _id: string;
  company: string;
  isProductCompany: boolean;
  jobPostLink: string;
  location: string | null;
  role: JobRole;
  level: JobLevel;
  salaryRange: string | null;
  salaryExpectations: string | null;
  appliedAt: Date;
  type: JobType;
  employmentType: JobEmploymentType | null;
  contractType: JobContractType | null;
  cv: JobCv;
  status: JobStatus;
  // Resolved from the status option so the client can render the badge without
  // a second lookup.
  statusColor: JobStatusColor;
  outcome: JobOutcome | null;
  notes: string | null;
  applicationQuestions: string | null;
  customFields: JobCustomFields;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // When the status last changed; distinct from `updatedAt`, which any edit bumps.
  statusChangedAt: Date;
};

/**
 * Days a closed application stays in the active list before the sweep archives
 * it. Counted from `updatedAt`, so editing the record starts the count over.
 */
const AUTO_ARCHIVE_AFTER_DAYS = 30;

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(JobEntity)
    private readonly repository: Repository<JobEntity>,
    private readonly jobRolesService: JobRolesService,
    private readonly jobLevelsService: JobLevelsService,
    private readonly jobTypesService: JobTypesService,
    private readonly jobEmploymentTypesService: JobEmploymentTypesService,
    private readonly jobContractTypesService: JobContractTypesService,
    private readonly jobStatusesService: JobStatusesService,
    private readonly jobOutcomesService: JobOutcomesService,
    private readonly jobFieldsService: JobFieldsService,
    private readonly attachments: JobAttachmentsService
  ) {}

  /**
   * Validates `customFields` against the caller's own field definitions.
   *
   * This cannot live in `ZodValidationPipe` on the controller: the pipe is
   * constructed once at decoration time and has no access to the current user,
   * while the accepted shape is per-user data.
   */
  private async validateCustomFields(
    userId: string,
    input: Record<string, unknown> | undefined
  ): Promise<JobCustomFields> {
    if (input === undefined) {
      return {};
    }

    const definitions = await this.jobFieldsService.listDefinitions(userId);
    const result = buildCustomFieldsSchema(definitions).safeParse(input);

    if (!result.success) {
      const issue = result.error.issues[0];
      const field = issue?.path.join('.') ?? 'customFields';
      throw new BadRequestException(
        apiError(
          'VALIDATION_FAILED',
          issue ? `${field}: ${issue.message}` : 'Invalid custom fields'
        )
      );
    }

    return result.data as JobCustomFields;
  }

  /** Loaded on every read so the DTO can resolve taxonomy labels from the options. */
  private static readonly TAXONOMY_RELATIONS = {
    roleOption: true,
    levelOption: true,
    typeOption: true,
    employmentTypeOption: true,
    contractTypeOption: true,
    statusOption: true,
    outcomeOption: true
  } as const;

  private toDate(value: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new Error('Invalid appliedAt date');
    }

    return date;
  }

  private mapEntityToJob(entity: JobEntity): Job {
    return {
      _id: entity.id,
      company: entity.company,
      isProductCompany: entity.isProductCompany,
      jobPostLink: entity.jobPostLink,
      location: entity.location,
      // Labels resolve from the option relation, so a rename shows through.
      role: entity.roleOption?.value ?? '',
      level: entity.levelOption?.value ?? '',
      salaryRange: entity.salaryRange,
      salaryExpectations: entity.salaryExpectations,
      appliedAt: entity.appliedAt,
      type: entity.typeOption?.value ?? '',
      // Resolved from the option relation, so a rename shows through.
      employmentType: entity.employmentTypeOption?.value ?? null,
      contractType: entity.contractTypeOption?.value ?? null,
      cv: entity.cv,
      status: entity.statusOption?.value ?? '',
      statusColor: entity.statusOption?.color ?? '#4a6088',
      // Resolved from the option relation, so a rename shows through.
      outcome: entity.outcomeOption?.value ?? null,
      notes: entity.notes,
      applicationQuestions: entity.applicationQuestions,
      customFields: entity.customFields ?? {},
      archivedAt: entity.archivedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      statusChangedAt: entity.statusChangedAt
    };
  }

  /** A re-save sends every field: an unchanged label keeps its option, so an archived one stays archived. */
  private relink<T extends TaxonomyOptionEntity, R extends T | null>(
    taxonomy: { resolveOption(userId: string, value: string): Promise<R> },
    userId: string,
    current: T | null,
    rawValue: string
  ): Promise<T | R> {
    return current !== null && current.value === rawValue.trim()
      ? Promise.resolve(current)
      : taxonomy.resolveOption(userId, rawValue);
  }

  async create(userId: string, input: CreateJobInput): Promise<Job> {
    const now = new Date();
    const customFields = await this.validateCustomFields(
      userId,
      input.customFields
    );

    const [
      roleOption,
      levelOption,
      typeOption,
      employmentTypeOption,
      contractTypeOption,
      statusOption,
      outcomeOption
    ] = await Promise.all([
      this.jobRolesService.resolveOption(userId, input.role),
      this.jobLevelsService.resolveOption(userId, input.level),
      this.jobTypesService.resolveOption(userId, input.type),
      // Optional and never defaulted: only resolve when a value is provided.
      input.employmentType
        ? this.jobEmploymentTypesService.resolveOption(
            userId,
            input.employmentType
          )
        : Promise.resolve(null),
      input.contractType
        ? this.jobContractTypesService.resolveOption(userId, input.contractType)
        : Promise.resolve(null),
      input.status
        ? this.jobStatusesService.resolveOption(userId, input.status)
        : this.jobStatusesService.getDefaultOption(userId),
      input.outcome
        ? this.jobOutcomesService.resolveOption(userId, input.outcome)
        : Promise.resolve(null)
    ]);

    const entity = this.repository.create({
      id: randomUUID(),
      userId,
      company: input.company,
      isProductCompany: input.isProductCompany,
      jobPostLink: input.jobPostLink,
      location: input.location ?? null,
      // The relation is set for the returned DTO; the FK id is what persists.
      roleOption,
      roleOptionId: roleOption?.id ?? null,
      levelOption,
      levelOptionId: levelOption?.id ?? null,
      typeOption,
      typeOptionId: typeOption?.id ?? null,
      employmentTypeOption,
      employmentTypeOptionId: employmentTypeOption?.id ?? null,
      contractTypeOption,
      contractTypeOptionId: contractTypeOption?.id ?? null,
      salaryRange: input.salaryRange ?? null,
      salaryExpectations: input.salaryExpectations ?? null,
      appliedAt: this.toDate(input.appliedAt),
      cv: input.cv,
      statusOption,
      statusOptionId: statusOption.id,
      outcomeOption,
      outcomeOptionId: outcomeOption?.id ?? null,
      notes: input.notes ?? null,
      applicationQuestions: input.applicationQuestions ?? null,
      customFields,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
      statusChangedAt: now
    });

    const saved = await this.repository.save(entity);
    return this.mapEntityToJob(saved);
  }

  /**
   * Archives every closed application that nobody has touched for
   * AUTO_ARCHIVE_AFTER_DAYS, across all users. Returns how many it archived.
   * Called from `JobsArchiveScheduler`, not from a request.
   */
  async runAutoArchive(): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - AUTO_ARCHIVE_AFTER_DAYS);

    const result = await this.repository
      .createQueryBuilder()
      .update(JobEntity)
      .set({ archivedAt: new Date() })
      .where('archived_at IS NULL')
      .andWhere('outcome_option_id IS NOT NULL')
      .andWhere('updated_at < :cutoff', { cutoff })
      .execute();

    return result.affected ?? 0;
  }

  async findAll(userId: string): Promise<Job[]> {
    const rows = await this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: JobsService.TAXONOMY_RELATIONS
    });
    return rows.map((row) => this.mapEntityToJob(row));
  }

  async findById(userId: string, id: string): Promise<Job | null> {
    const row = await this.repository.findOne({
      where: { id, userId },
      relations: JobsService.TAXONOMY_RELATIONS
    });
    if (!row) {
      return null;
    }

    return this.mapEntityToJob(row);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateJobInput
  ): Promise<Job | null> {
    const row = await this.repository.findOne({
      where: { id, userId },
      relations: JobsService.TAXONOMY_RELATIONS
    });
    if (!row) {
      return null;
    }

    if (input.role !== undefined) {
      const option = await this.relink(
        this.jobRolesService,
        userId,
        row.roleOption,
        input.role
      );
      row.roleOption = option;
      row.roleOptionId = option?.id ?? null;
    }

    if (input.level !== undefined) {
      const option = await this.relink(
        this.jobLevelsService,
        userId,
        row.levelOption,
        input.level
      );
      row.levelOption = option;
      row.levelOptionId = option?.id ?? null;
    }

    if (input.type !== undefined) {
      const option = await this.relink(
        this.jobTypesService,
        userId,
        row.typeOption,
        input.type
      );
      row.typeOption = option;
      row.typeOptionId = option?.id ?? null;
    }

    if (input.employmentType !== undefined) {
      // Clearing (null/empty) drops the link; otherwise resolve it.
      const option = input.employmentType
        ? await this.relink(
            this.jobEmploymentTypesService,
            userId,
            row.employmentTypeOption,
            input.employmentType
          )
        : null;
      row.employmentTypeOption = option;
      row.employmentTypeOptionId = option?.id ?? null;
    }

    if (input.contractType !== undefined) {
      const option = input.contractType
        ? await this.relink(
            this.jobContractTypesService,
            userId,
            row.contractTypeOption,
            input.contractType
          )
        : null;
      row.contractTypeOption = option;
      row.contractTypeOptionId = option?.id ?? null;
    }

    if (input.company !== undefined) {
      row.company = input.company;
    }

    if (input.isProductCompany !== undefined) {
      row.isProductCompany = input.isProductCompany;
    }

    if (input.jobPostLink !== undefined) {
      row.jobPostLink = input.jobPostLink;
    }

    if (input.location !== undefined) {
      row.location = input.location ?? null;
    }

    if (input.cv !== undefined) {
      row.cv = input.cv;
    }

    if (input.status !== undefined && input.status !== null) {
      const option = await this.relink(
        this.jobStatusesService,
        userId,
        row.statusOption,
        input.status
      );
      // Only a real change of status advances the timestamp; re-saving the same
      // status (e.g. an edit to other fields) leaves it alone.
      if (option.id !== row.statusOptionId) {
        row.statusChangedAt = new Date();
      }
      row.statusOption = option;
      row.statusOptionId = option.id;
    }

    if (input.outcome !== undefined) {
      // Clearing the outcome (null/empty) drops the link; otherwise resolve it.
      const option = input.outcome
        ? await this.relink(
            this.jobOutcomesService,
            userId,
            row.outcomeOption,
            input.outcome
          )
        : null;
      row.outcomeOption = option;
      row.outcomeOptionId = option?.id ?? null;
    }

    if (input.salaryRange !== undefined) {
      row.salaryRange = input.salaryRange ?? null;
    }

    if (input.salaryExpectations !== undefined) {
      row.salaryExpectations = input.salaryExpectations ?? null;
    }

    if (input.notes !== undefined) {
      row.notes = input.notes ?? null;
    }

    if (input.applicationQuestions !== undefined) {
      row.applicationQuestions = input.applicationQuestions ?? null;
    }

    // Merged, not replaced, so a PATCH touching only some keys leaves the rest —
    // including values of archived fields — intact.
    if (input.customFields !== undefined) {
      const customFields = await this.validateCustomFields(
        userId,
        input.customFields
      );
      row.customFields = { ...(row.customFields ?? {}), ...customFields };
    }

    if (input.appliedAt !== undefined) {
      row.appliedAt = this.toDate(input.appliedAt);
    }

    row.updatedAt = new Date();
    const saved = await this.repository.save(row);
    return this.mapEntityToJob(saved);
  }

  /**
   * Separate from `update`: the client sends the whole record when it updates,
   * so an edit would overwrite this flag.
   */
  async setArchived(
    userId: string,
    id: string,
    archived: boolean
  ): Promise<Job | null> {
    const row = await this.repository.findOne({
      where: { id, userId },
      relations: JobsService.TAXONOMY_RELATIONS
    });
    if (!row) {
      return null;
    }

    row.archivedAt = archived ? new Date() : null;
    // Restoring must bump `updatedAt`, or the sweep would archive the record
    // again on the next list read.
    row.updatedAt = new Date();

    const saved = await this.repository.save(row);
    return this.mapEntityToJob(saved);
  }

  /**
   * `setArchived` for many records at once. Only rows that change state are
   * touched, so an archived row keeps its original `archivedAt`. Ids that are
   * not the caller's are skipped; returns the rows it changed.
   */
  async setArchivedMany(
    userId: string,
    ids: string[],
    archived: boolean
  ): Promise<Job[]> {
    const now = new Date();
    const result = await this.repository
      .createQueryBuilder()
      .update(JobEntity)
      .set({ archivedAt: archived ? now : null, updatedAt: now })
      .where('user_id = :userId', { userId })
      .andWhere('id IN (:...ids)', { ids })
      .andWhere(archived ? 'archived_at IS NULL' : 'archived_at IS NOT NULL')
      .returning(['id'])
      .execute();

    const changedIds = (result.raw as { id: string }[]).map((row) => row.id);
    if (changedIds.length === 0) {
      return [];
    }

    const rows = await this.repository.find({
      where: { userId, id: In(changedIds) },
      relations: JobsService.TAXONOMY_RELATIONS
    });
    return rows.map((row) => this.mapEntityToJob(row));
  }

  async remove(userId: string, id: string): Promise<boolean> {
    // The rows cascade with the job; the files on disk are removed here.
    const attachmentIds = await this.attachments.idsForJob(userId, id);
    const result = await this.repository.delete({ id, userId });
    if (result.affected !== 1) return false;
    await this.attachments.removeFiles(attachmentIds);
    return true;
  }
}
