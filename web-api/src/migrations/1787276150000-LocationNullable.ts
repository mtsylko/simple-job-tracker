import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops the NOT NULL constraint on `jobs.location`. The column is optional — the
 * entity marks it nullable, `PromoteLocationField` added it as nullable, and the
 * form leaves it blank — but some databases carried a NOT NULL constraint from an
 * earlier `synchronize` pass, which rejected every application saved without a
 * location. `DROP NOT NULL` is a no-op where the column is already nullable.
 */
export class LocationNullable1787276150000 implements MigrationInterface {
  name = 'LocationNullable1787276150000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "jobs" ALTER COLUMN "location" DROP NOT NULL`
    );
  }

  public async down(): Promise<void> {
    // Intentionally a no-op: the column is meant to be nullable, and re-adding
    // NOT NULL would fail on any row that has no location.
  }
}
