import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds two new per-user taxonomies: `job_employment_types` (work-time) and
 * `job_contract_types` (legal contract form). Both are brand-new fields, so
 * there is no legacy column to backfill — the migration just creates the tables,
 * seeds every existing user with the built-ins, and adds the nullable FK columns
 * to `jobs`. The seeded `value`s must match `BUILT_IN_EMPLOYMENT_TYPES` and
 * `BUILT_IN_CONTRACT_TYPES` in shared.
 */
export class EmploymentAndContractTaxonomies1787276110000 implements MigrationInterface {
  name = 'EmploymentAndContractTaxonomies1787276110000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "job_employment_types" ("id" text NOT NULL, "user_id" text, "value" text NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', "is_default" boolean NOT NULL DEFAULT false, "archived_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_job_employment_types_user_value" UNIQUE ("user_id", "value"), CONSTRAINT "PK_job_employment_types" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "job_contract_types" ("id" text NOT NULL, "user_id" text, "value" text NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', "is_default" boolean NOT NULL DEFAULT false, "archived_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_job_contract_types_user_value" UNIQUE ("user_id", "value"), CONSTRAINT "PK_job_contract_types" PRIMARY KEY ("id"))`
    );

    // Seed the built-ins for every owner (users, plus any user_id referenced by
    // existing jobs). ON CONFLICT keeps it idempotent if re-run.
    await queryRunner.query(`
      WITH owners AS (
        SELECT "id" AS user_id FROM "users"
        UNION
        SELECT DISTINCT "user_id" FROM "jobs" WHERE "user_id" IS NOT NULL
      )
      INSERT INTO "job_employment_types" ("id", "user_id", "value", "sort_order", "is_default", "archived_at", "created_at", "updated_at")
      SELECT gen_random_uuid()::text, o.user_id, s.value, s.sort_order, s.is_default, NULL, now(), now()
      FROM owners o
      CROSS JOIN (VALUES
        ('Full-time', 0, true),
        ('Part-time', 1, false),
        ('Internship', 2, false),
        ('Temporary', 3, false)
      ) AS s(value, sort_order, is_default)
      ON CONFLICT ("user_id", "value") DO NOTHING
    `);

    await queryRunner.query(`
      WITH owners AS (
        SELECT "id" AS user_id FROM "users"
        UNION
        SELECT DISTINCT "user_id" FROM "jobs" WHERE "user_id" IS NOT NULL
      )
      INSERT INTO "job_contract_types" ("id", "user_id", "value", "sort_order", "is_default", "archived_at", "created_at", "updated_at")
      SELECT gen_random_uuid()::text, o.user_id, s.value, s.sort_order, s.is_default, NULL, now(), now()
      FROM owners o
      CROSS JOIN (VALUES
        ('Contract of Employment', 0, true),
        ('B2B', 1, false),
        ('Contract of Mandate', 2, false),
        ('Contract for Specific Work', 3, false)
      ) AS s(value, sort_order, is_default)
      ON CONFLICT ("user_id", "value") DO NOTHING
    `);

    await queryRunner.query(
      `ALTER TABLE "jobs" ADD "employment_type_option_id" text`
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD "contract_type_option_id" text`
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_jobs_employment_type_option" FOREIGN KEY ("employment_type_option_id") REFERENCES "job_employment_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_jobs_contract_type_option" FOREIGN KEY ("contract_type_option_id") REFERENCES "job_contract_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP CONSTRAINT "FK_jobs_contract_type_option"`
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP CONSTRAINT "FK_jobs_employment_type_option"`
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP COLUMN "contract_type_option_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP COLUMN "employment_type_option_id"`
    );
    await queryRunner.query(`DROP TABLE "job_contract_types"`);
    await queryRunner.query(`DROP TABLE "job_employment_types"`);
  }
}
