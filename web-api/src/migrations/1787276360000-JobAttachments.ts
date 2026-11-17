import { MigrationInterface, QueryRunner } from 'typeorm';

/** Files kept with an application, such as interview transcripts; they go with the job. */
export class JobAttachments1787276360000 implements MigrationInterface {
  name = 'JobAttachments1787276360000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "job_attachments" (
        "id" uuid NOT NULL,
        "user_id" text NOT NULL,
        "job_id" text NOT NULL,
        "file_name" text NOT NULL,
        "size" integer NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_job_attachments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_job_attachments_job" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_job_attachments_job_id" ON "job_attachments" ("job_id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "job_attachments"`);
  }
}
