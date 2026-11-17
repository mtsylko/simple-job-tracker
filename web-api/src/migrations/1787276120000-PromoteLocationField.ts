import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Promotes "Location" from a user-defined custom field to a first-class built-in
 * column on `jobs`. Previously the value lived in `jobs.custom_fields->>'location'`
 * behind a `job_field_definitions` row with key `location`.
 *
 * The column is nullable (location is optional); values are backfilled from the
 * jsonb key, that key is stripped from every job so it stops rendering in the
 * "Additional fields" section, and the retired definition rows are deleted.
 */
export class PromoteLocationField1787276120000 implements MigrationInterface {
  name = 'PromoteLocationField1787276120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "jobs" ADD "location" text`);

    // Copy the stored custom-field value into the new column, trimming and
    // nulling out blank entries.
    await queryRunner.query(`
      UPDATE "jobs"
      SET "location" = NULLIF(trim(both from ("custom_fields" ->> 'location')), '')
      WHERE ("custom_fields" ->> 'location') IS NOT NULL
    `);

    // Drop the now-migrated key so the field no longer renders as a custom field.
    await queryRunner.query(`
      UPDATE "jobs"
      SET "custom_fields" = "custom_fields" - 'location'
      WHERE "custom_fields" ? 'location'
    `);

    // Retire the custom-field definitions; the data has moved to the column.
    await queryRunner.query(
      `DELETE FROM "job_field_definitions" WHERE "key" = 'location'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Best-effort restore: fold non-null locations back into the jsonb map. The
    // deleted definition rows are not recreated.
    await queryRunner.query(`
      UPDATE "jobs"
      SET "custom_fields" = jsonb_set("custom_fields", '{location}', to_jsonb("location"))
      WHERE "location" IS NOT NULL
    `);
    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "location"`);
  }
}
