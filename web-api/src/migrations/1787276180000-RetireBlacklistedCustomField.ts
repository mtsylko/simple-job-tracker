import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Retires the legacy "Blacklisted" custom field. Its tick lived in
 * `jobs.custom_fields->>'blacklisted'` and was never wired to `job_blacklist`,
 * the list the Blacklist page reads, so every marked company moves there first
 * (one entry per user and normalized name), then the key and the definition
 * rows go. `company_normalized` must match `normalizeCompanyName` in shared.
 */
export class RetireBlacklistedCustomField1787276180000 implements MigrationInterface {
  name = 'RetireBlacklistedCustomField1787276180000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // DISTINCT ON keeps the oldest job's spelling when several name the same
    // company; ON CONFLICT skips what the user has already blacklisted by hand.
    await queryRunner.query(`
      INSERT INTO "job_blacklist" ("id", "user_id", "company", "company_normalized", "reason", "created_at", "updated_at")
      SELECT gen_random_uuid()::text, m.user_id, m.company, m.company_normalized, NULL, now(), now()
      FROM (
        SELECT DISTINCT ON ("user_id", lower(regexp_replace(btrim("company"), '\\s+', ' ', 'g')))
          "user_id",
          btrim("company") AS company,
          lower(regexp_replace(btrim("company"), '\\s+', ' ', 'g')) AS company_normalized
        FROM "jobs"
        WHERE ("custom_fields" ->> 'blacklisted') = 'true'
          AND "user_id" IS NOT NULL
          AND btrim("company") <> ''
        ORDER BY "user_id", lower(regexp_replace(btrim("company"), '\\s+', ' ', 'g')), "created_at"
      ) m
      ON CONFLICT ("user_id", "company_normalized") DO NOTHING
    `);

    // Drop the retired key so no job carries a value nothing renders.
    await queryRunner.query(`
      UPDATE "jobs"
      SET "custom_fields" = "custom_fields" - 'blacklisted'
      WHERE "custom_fields" ? 'blacklisted'
    `);

    await queryRunner.query(
      `DELETE FROM "job_field_definitions" WHERE "key" = 'blacklisted'`
    );
  }

  public async down(): Promise<void> {
    // One-way: which job carried a tick is not recoverable once the companies
    // live in `job_blacklist`, so neither the keys nor the definitions come back.
  }
}
