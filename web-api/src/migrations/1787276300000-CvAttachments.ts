import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

const logger = new Logger('CvAttachmentsMigration');

const STORED_FILE_ID = `substring("attachment" FROM '^/uploads/cv-attachments/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\.pdf$')::uuid`;
const EXTERNAL_URL = `'^https?://\\S+$'`;

/** CV files move to `cv_attachments`, owned per user, and a version points at one by id. */
export class CvAttachments1787276300000 implements MigrationInterface {
  name = 'CvAttachments1787276300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "cv_attachments" ("id" uuid NOT NULL, "user_id" text NOT NULL, "external_url" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_cv_attachments" PRIMARY KEY ("id"), CONSTRAINT "UQ_cv_attachments_user_id" UNIQUE ("user_id", "id"), CONSTRAINT "CHK_cv_attachments_external_url" CHECK ("external_url" ~ ${EXTERNAL_URL}))`
    );
    await queryRunner.query(
      `ALTER TABLE "cv_versions" ADD "attachment_id" uuid`
    );
    // A stored file goes to the earliest version that points at it, and its user owns it.
    await queryRunner.query(
      `UPDATE "cv_versions" AS "version" SET "attachment_id" = "claim"."file_id" FROM (SELECT DISTINCT ON ("file_id") "id", "file_id" FROM (SELECT "id", "created_at", ${STORED_FILE_ID} AS "file_id" FROM "cv_versions" WHERE "user_id" IS NOT NULL) AS "stored" WHERE "file_id" IS NOT NULL ORDER BY "file_id", "created_at", "id") AS "claim" WHERE "version"."id" = "claim"."id"`
    );
    // Each external link becomes an attachment of its own version.
    await queryRunner.query(
      `UPDATE "cv_versions" SET "attachment_id" = gen_random_uuid() WHERE "user_id" IS NOT NULL AND "attachment" ~ ${EXTERNAL_URL}`
    );
    await queryRunner.query(
      `INSERT INTO "cv_attachments" ("id", "user_id", "external_url", "created_at") SELECT "attachment_id", "user_id", CASE WHEN "attachment" ~ ${EXTERNAL_URL} THEN "attachment" END, "created_at" FROM "cv_versions" WHERE "attachment_id" IS NOT NULL`
    );
    // Dropped with the column: another user's file, a second pointer, free text, or a row with no user.
    const [{ dropped }] = (await queryRunner.query(
      `SELECT count(*)::int AS "dropped" FROM "cv_versions" WHERE "attachment" IS NOT NULL AND "attachment_id" IS NULL`
    )) as { dropped: number }[];
    if (dropped > 0) {
      logger.warn(
        `Dropping ${dropped} CV attachment values no version can own; the nightly sweep then deletes their files`
      );
    }
    await queryRunner.query(
      `ALTER TABLE "cv_versions" DROP COLUMN "attachment"`
    );
    await queryRunner.query(
      `ALTER TABLE "cv_versions" ADD CONSTRAINT "UQ_cv_versions_attachment_id" UNIQUE ("attachment_id")`
    );
    await queryRunner.query(
      `ALTER TABLE "cv_versions" ADD CONSTRAINT "FK_cv_versions_attachment" FOREIGN KEY ("user_id", "attachment_id") REFERENCES "cv_attachments"("user_id","id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cv_versions" ADD "attachment" text`);
    await queryRunner.query(
      `UPDATE "cv_versions" AS "version" SET "attachment" = coalesce("file"."external_url", '/uploads/cv-attachments/' || "file"."id" || '.pdf') FROM "cv_attachments" AS "file" WHERE "file"."id" = "version"."attachment_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "cv_versions" DROP CONSTRAINT "FK_cv_versions_attachment"`
    );
    await queryRunner.query(
      `ALTER TABLE "cv_versions" DROP CONSTRAINT "UQ_cv_versions_attachment_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "cv_versions" DROP COLUMN "attachment_id"`
    );
    await queryRunner.query(`DROP TABLE "cv_attachments"`);
  }
}
