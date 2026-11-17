import { MigrationInterface, QueryRunner } from 'typeorm';

/** `job_blacklist` becomes `companies`, with blacklisting as a nullable fact on each row. */
export class Companies1787276290000 implements MigrationInterface {
  name = 'Companies1787276290000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "job_blacklist" RENAME TO "companies"`
    );
    await queryRunner.query(
      `ALTER TABLE "companies" RENAME COLUMN "company" TO "name"`
    );
    await queryRunner.query(
      `ALTER TABLE "companies" RENAME COLUMN "company_normalized" TO "name_normalized"`
    );
    await queryRunner.query(
      `ALTER TABLE "companies" RENAME COLUMN "reason" TO "blacklist_reason"`
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD "blacklisted_at" TIMESTAMP WITH TIME ZONE`
    );
    await queryRunner.query(
      `UPDATE "companies" SET "blacklisted_at" = "created_at"`
    );
    await queryRunner.query(
      `ALTER TABLE "companies" RENAME CONSTRAINT "UQ_job_blacklist_user_company" TO "UQ_companies_user_name"`
    );
    await queryRunner.query(
      `ALTER TABLE "companies" RENAME CONSTRAINT "PK_job_blacklist" TO "PK_companies"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // The old table could only hold blacklisted companies.
    await queryRunner.query(
      `DELETE FROM "companies" WHERE "blacklisted_at" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "companies" RENAME CONSTRAINT "PK_companies" TO "PK_job_blacklist"`
    );
    await queryRunner.query(
      `ALTER TABLE "companies" RENAME CONSTRAINT "UQ_companies_user_name" TO "UQ_job_blacklist_user_company"`
    );
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN "blacklisted_at"`
    );
    await queryRunner.query(
      `ALTER TABLE "companies" RENAME COLUMN "blacklist_reason" TO "reason"`
    );
    await queryRunner.query(
      `ALTER TABLE "companies" RENAME COLUMN "name_normalized" TO "company_normalized"`
    );
    await queryRunner.query(
      `ALTER TABLE "companies" RENAME COLUMN "name" TO "company"`
    );
    await queryRunner.query(
      `ALTER TABLE "companies" RENAME TO "job_blacklist"`
    );
  }
}
