import type { EntityTarget, ObjectLiteral } from 'typeorm';
import { AdminViewSessionEntity } from '../admin/admin-view-session.entity';
import { CompanyEntity } from '../companies/company.entity';
import { CvAttachmentEntity } from '../cv-versions/cv-attachment.entity';
import { CvVersionEntity } from '../cv-versions/cv-version.entity';
import { FeedbackEntity } from '../feedback/feedback.entity';
import { FormLayoutEntity } from '../form-layout/form-layout.entity';
import { JobContractTypeOptionEntity } from '../job-contract-types/job-contract-type-option.entity';
import { JobEmploymentTypeOptionEntity } from '../job-employment-types/job-employment-type-option.entity';
import { JobFieldDefinitionEntity } from '../job-fields/job-field-definition.entity';
import { JobLevelOptionEntity } from '../job-levels/job-level-option.entity';
import { JobOutcomeOptionEntity } from '../job-outcomes/job-outcome-option.entity';
import { JobRoleOptionEntity } from '../job-roles/job-role-option.entity';
import { JobStatusOptionEntity } from '../job-statuses/job-status-option.entity';
import { JobTypeOptionEntity } from '../job-types/job-type-option.entity';
import { JobAttachmentEntity } from '../jobs/job-attachment.entity';
import { JobEntity } from '../jobs/job.entity';

/** Every table keyed by `user_id`, in an order that deletes rows before the rows they point at. */
export const USER_OWNED_ENTITIES: readonly EntityTarget<ObjectLiteral>[] = [
  JobAttachmentEntity,
  JobEntity,
  CvVersionEntity,
  CvAttachmentEntity,
  JobRoleOptionEntity,
  JobLevelOptionEntity,
  JobTypeOptionEntity,
  JobEmploymentTypeOptionEntity,
  JobContractTypeOptionEntity,
  JobStatusOptionEntity,
  JobOutcomeOptionEntity,
  CompanyEntity,
  JobFieldDefinitionEntity,
  FormLayoutEntity,
  FeedbackEntity,
  AdminViewSessionEntity
];
