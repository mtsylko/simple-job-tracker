import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Follow-up to StatusTaxonomy: status colours moved from named swatches to hex.
 * Rows seeded by the earlier build still hold names, so convert them in place.
 * Also drops the `kind` column an even earlier build may have created (the
 * lifecycle concept was removed), which otherwise breaks inserts if it is NOT
 * NULL. Both steps are idempotent.
 */
export class StatusColorHex1787276095000 implements MigrationInterface {
  name = 'StatusColorHex1787276095000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "job_statuses" SET "color" = CASE "color"
        WHEN 'slate' THEN '#4a6088'
        WHEN 'blue' THEN '#2a6fb5'
        WHEN 'teal' THEN '#1f7c88'
        WHEN 'green' THEN '#2c8552'
        WHEN 'amber' THEN '#a8801f'
        WHEN 'violet' THEN '#6259a8'
        WHEN 'rose' THEN '#b23a48'
        WHEN 'gray' THEN '#6b6b6b'
        ELSE "color"
      END
      WHERE "color" IN ('slate', 'blue', 'teal', 'green', 'amber', 'violet', 'rose', 'gray')
    `);

    await queryRunner.query(
      `ALTER TABLE "job_statuses" DROP COLUMN IF EXISTS "kind"`
    );
  }

  public async down(): Promise<void> {
    // One-way data fix: hex → name and re-adding `kind` would both be lossy.
  }
}
