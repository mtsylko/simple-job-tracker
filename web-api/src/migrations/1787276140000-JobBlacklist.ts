import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates `job_blacklist`: a per-user list of companies the user has decided not
 * to apply to. `company_normalized` (lowercased/whitespace-collapsed) backs the
 * per-user uniqueness constraint and future match-on-entry. No FK from `jobs` —
 * the list is standalone.
 */
export class JobBlacklist1787276140000 implements MigrationInterface {
  name = 'JobBlacklist1787276140000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "job_blacklist" ("id" text NOT NULL, "user_id" text, "company" text NOT NULL, "company_normalized" text NOT NULL, "reason" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_job_blacklist_user_company" UNIQUE ("user_id", "company_normalized"), CONSTRAINT "PK_job_blacklist" PRIMARY KEY ("id"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "job_blacklist"`);
  }
}
