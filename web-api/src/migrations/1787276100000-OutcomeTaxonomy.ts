import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Turns `jobs.outcome` from a fixed text enum into the fifth per-user taxonomy.
 * Creates `job_outcomes`, seeds every existing user with the four built-ins,
 * repoints jobs at the seeded option by FK, then drops the text column. The
 * built-in `value`s below must match `BUILT_IN_JOB_OUTCOMES` in shared. The
 * backfill CASE collapses the eight legacy slugs into the four labels (lossy by
 * design): rejected-by-* -> Rejected; withdrawn-by-* and offer-withdrawn-by-company
 * -> Withdrawn; ghosted and no-response -> Ghosted; position-closed -> Position closed.
 */
export class OutcomeTaxonomy1787276100000 implements MigrationInterface {
  name = 'OutcomeTaxonomy1787276100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "job_outcomes" ("id" text NOT NULL, "user_id" text, "value" text NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', "is_default" boolean NOT NULL DEFAULT false, "archived_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_job_outcomes_user_value" UNIQUE ("user_id", "value"), CONSTRAINT "PK_job_outcomes" PRIMARY KEY ("id"))`
    );

    // Seed the built-ins for every owner (users, plus any user_id referenced by
    // existing jobs). ON CONFLICT keeps it idempotent if re-run.
    await queryRunner.query(`
      WITH owners AS (
        SELECT "id" AS user_id FROM "users"
        UNION
        SELECT DISTINCT "user_id" FROM "jobs" WHERE "user_id" IS NOT NULL
      )
      INSERT INTO "job_outcomes" ("id", "user_id", "value", "sort_order", "is_default", "archived_at", "created_at", "updated_at")
      SELECT gen_random_uuid()::text, o.user_id, s.value, s.sort_order, s.is_default, NULL, now(), now()
      FROM owners o
      CROSS JOIN (VALUES
        ('Rejected', 0, true),
        ('Withdrawn', 1, false),
        ('Ghosted', 2, false),
        ('Position closed', 3, false)
      ) AS s(value, sort_order, is_default)
      ON CONFLICT ("user_id", "value") DO NOTHING
    `);

    await queryRunner.query(`ALTER TABLE "jobs" ADD "outcome_option_id" text`);

    // Backfill: collapse each legacy slug to the seeded label, matched per user.
    // Rows with no outcome (or an unrecognised value) stay NULL.
    await queryRunner.query(`
      UPDATE "jobs" j
      SET "outcome_option_id" = s."id"
      FROM "job_outcomes" s
      WHERE s."user_id" = j."user_id"
        AND s."value" = CASE j."outcome"
          WHEN 'rejected-by-company' THEN 'Rejected'
          WHEN 'rejected-by-me' THEN 'Rejected'
          WHEN 'withdrawn-by-company' THEN 'Withdrawn'
          WHEN 'withdrawn-by-me' THEN 'Withdrawn'
          WHEN 'offer-withdrawn-by-company' THEN 'Withdrawn'
          WHEN 'position-closed' THEN 'Position closed'
          WHEN 'ghosted' THEN 'Ghosted'
          WHEN 'no-response' THEN 'Ghosted'
          ELSE NULL
        END
    `);

    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_jobs_outcome_option" FOREIGN KEY ("outcome_option_id") REFERENCES "job_outcomes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "outcome"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "jobs" ADD "outcome" text`);

    // Best-effort restore: map the seeded label back to a representative slug.
    // The by-company/by-me distinction was dropped in `up`, so it cannot return.
    await queryRunner.query(`
      UPDATE "jobs" j
      SET "outcome" = CASE s."value"
        WHEN 'Rejected' THEN 'rejected-by-company'
        WHEN 'Withdrawn' THEN 'withdrawn-by-me'
        WHEN 'Ghosted' THEN 'ghosted'
        WHEN 'Position closed' THEN 'position-closed'
        ELSE NULL
      END
      FROM "job_outcomes" s
      WHERE s."id" = j."outcome_option_id"
    `);

    await queryRunner.query(
      `ALTER TABLE "jobs" DROP CONSTRAINT "FK_jobs_outcome_option"`
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP COLUMN "outcome_option_id"`
    );
    await queryRunner.query(`DROP TABLE "job_outcomes"`);
  }
}
