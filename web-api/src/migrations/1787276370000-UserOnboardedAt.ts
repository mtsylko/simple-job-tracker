import { MigrationInterface, QueryRunner } from 'typeorm';

/** When the user left the onboarding screen; existing accounts with any data count as onboarded. */
export class UserOnboardedAt1787276370000 implements MigrationInterface {
  name = 'UserOnboardedAt1787276370000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "onboarded_at" TIMESTAMP WITH TIME ZONE`
    );
    // An account with nothing set up yet still gets the preset screen.
    await queryRunner.query(`
      UPDATE "users" u SET "onboarded_at" = now()
      WHERE EXISTS (SELECT 1 FROM "jobs" WHERE "user_id" = u."id")
         OR EXISTS (SELECT 1 FROM "job_roles" WHERE "user_id" = u."id")
         OR EXISTS (SELECT 1 FROM "job_levels" WHERE "user_id" = u."id")
         OR EXISTS (SELECT 1 FROM "job_types" WHERE "user_id" = u."id")
         OR EXISTS (SELECT 1 FROM "job_field_definitions" WHERE "user_id" = u."id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "onboarded_at"`);
  }
}
