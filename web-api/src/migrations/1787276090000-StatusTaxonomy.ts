import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Turns `jobs.status` from a fixed text enum into the fourth per-user taxonomy.
 * Creates `job_statuses`, seeds every existing user with the six built-ins,
 * repoints jobs at the seeded option by FK, then drops the text column. The
 * built-in `value`s below must match `BUILT_IN_JOB_STATUSES` in shared, and the
 * CASE maps each legacy slug to its seeded label so the backfill is lossless.
 */
export class StatusTaxonomy1787276090000 implements MigrationInterface {
  name = 'StatusTaxonomy1787276090000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "job_statuses" ("id" text NOT NULL, "user_id" text, "value" text NOT NULL, "color" text NOT NULL, "show_as_tab" boolean NOT NULL DEFAULT false, "sort_order" integer NOT NULL DEFAULT '0', "is_default" boolean NOT NULL DEFAULT false, "archived_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_job_statuses_user_value" UNIQUE ("user_id", "value"), CONSTRAINT "PK_job_statuses" PRIMARY KEY ("id"))`
    );

    // Seed the built-ins for every owner (users, plus any user_id referenced by
    // existing jobs). ON CONFLICT keeps it idempotent if re-run.
    await queryRunner.query(`
      WITH owners AS (
        SELECT "id" AS user_id FROM "users"
        UNION
        SELECT DISTINCT "user_id" FROM "jobs" WHERE "user_id" IS NOT NULL
      )
      INSERT INTO "job_statuses" ("id", "user_id", "value", "color", "show_as_tab", "sort_order", "is_default", "archived_at", "created_at", "updated_at")
      SELECT gen_random_uuid()::text, o.user_id, s.value, s.color, s.show_as_tab, s.sort_order, s.is_default, NULL, now(), now()
      FROM owners o
      CROSS JOIN (VALUES
        ('Applied', '#4a6088', true, 0, true),
        ('HR', '#2a6fb5', true, 1, false),
        ('Technical', '#a8801f', true, 2, false),
        ('Contacted me', '#6259a8', false, 3, false),
        ('Test task', '#1f7c88', false, 4, false),
        ('Offer', '#2c8552', true, 5, false)
      ) AS s(value, color, show_as_tab, sort_order, is_default)
      ON CONFLICT ("user_id", "value") DO NOTHING
    `);

    await queryRunner.query(`ALTER TABLE "jobs" ADD "status_option_id" text`);

    // Backfill: map each legacy slug to the seeded label, matched per user.
    await queryRunner.query(`
      UPDATE "jobs" j
      SET "status_option_id" = s."id"
      FROM "job_statuses" s
      WHERE s."user_id" = j."user_id"
        AND s."value" = CASE j."status"
          WHEN 'applied' THEN 'Applied'
          WHEN 'hr' THEN 'HR'
          WHEN 'technical' THEN 'Technical'
          WHEN 'contacted-me' THEN 'Contacted me'
          WHEN 'test-task' THEN 'Test task'
          WHEN 'offer' THEN 'Offer'
          ELSE j."status"
        END
    `);

    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_jobs_status_option" FOREIGN KEY ("status_option_id") REFERENCES "job_statuses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "status"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD "status" text NOT NULL DEFAULT 'applied'`
    );

    // Best-effort restore: map the seeded label back to its legacy slug.
    await queryRunner.query(`
      UPDATE "jobs" j
      SET "status" = CASE s."value"
        WHEN 'Applied' THEN 'applied'
        WHEN 'HR' THEN 'hr'
        WHEN 'Technical' THEN 'technical'
        WHEN 'Contacted me' THEN 'contacted-me'
        WHEN 'Test task' THEN 'test-task'
        WHEN 'Offer' THEN 'offer'
        ELSE 'applied'
      END
      FROM "job_statuses" s
      WHERE s."id" = j."status_option_id"
    `);

    await queryRunner.query(
      `ALTER TABLE "jobs" ALTER COLUMN "status" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP CONSTRAINT "FK_jobs_status_option"`
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP COLUMN "status_option_id"`
    );
    await queryRunner.query(`DROP TABLE "job_statuses"`);
  }
}
