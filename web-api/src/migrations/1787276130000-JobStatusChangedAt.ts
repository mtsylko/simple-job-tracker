import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `jobs.status_changed_at`: when the application's status last changed,
 * distinct from `updated_at`, which any edit bumps. New rows set it on create
 * and only when an update actually changes the status.
 *
 * Existing rows have no history to draw on, so they are backfilled from
 * `updated_at` — the closest available approximation — before the column is
 * made NOT NULL.
 */
export class JobStatusChangedAt1787276130000 implements MigrationInterface {
  name = 'JobStatusChangedAt1787276130000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD "status_changed_at" timestamptz`
    );
    await queryRunner.query(
      `UPDATE "jobs" SET "status_changed_at" = "updated_at"`
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ALTER COLUMN "status_changed_at" SET NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP COLUMN "status_changed_at"`
    );
  }
}
