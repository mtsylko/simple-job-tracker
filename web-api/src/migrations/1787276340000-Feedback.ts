import { MigrationInterface, QueryRunner } from 'typeorm';

/** Messages users send from the app's feedback dialog. */
export class Feedback1787276340000 implements MigrationInterface {
  name = 'Feedback1787276340000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "feedback" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" text NOT NULL,
        "kind" text NOT NULL,
        "message" text NOT NULL,
        "page_path" text,
        "user_agent" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "resolved_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_feedback" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_feedback_kind" CHECK ("kind" IN ('bug', 'idea', 'question')),
        CONSTRAINT "FK_feedback_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_feedback_user_created" ON "feedback" ("user_id", "created_at")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "feedback"`);
  }
}
