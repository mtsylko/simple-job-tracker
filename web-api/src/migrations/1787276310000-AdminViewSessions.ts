import { MigrationInterface, QueryRunner } from 'typeorm';

/** The log of every time an admin opens a user's account. */
export class AdminViewSessions1787276310000 implements MigrationInterface {
  name = 'AdminViewSessions1787276310000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "admin_view_sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "admin_id" text NOT NULL,
        "user_id" text NOT NULL,
        "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "ended_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_admin_view_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_admin_view_sessions_admin" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_admin_view_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_admin_view_sessions_admin_user" ON "admin_view_sessions" ("admin_id", "user_id", "started_at")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "admin_view_sessions"`);
  }
}
