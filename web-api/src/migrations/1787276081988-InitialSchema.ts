import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1787276081988 implements MigrationInterface {
  name = 'InitialSchema1787276081988';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "job_roles" ("id" text NOT NULL, "user_id" text, "value" text NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', "is_default" boolean NOT NULL DEFAULT false, "archived_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_6b35e4d7f68b37237ef514e188b" UNIQUE ("user_id", "value"), CONSTRAINT "PK_2010ead772199469bfe54ea513b" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "job_levels" ("id" text NOT NULL, "user_id" text, "value" text NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', "is_default" boolean NOT NULL DEFAULT false, "archived_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_5f798a23d4c14b02b4029b1a889" UNIQUE ("user_id", "value"), CONSTRAINT "PK_86a4e88cf87968ed4bfc349eaa3" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "job_types" ("id" text NOT NULL, "user_id" text, "value" text NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', "is_default" boolean NOT NULL DEFAULT false, "archived_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_ced0e4c1e7bd2e64c3e98d21e45" UNIQUE ("user_id", "value"), CONSTRAINT "PK_87d4226cb676b3b16518977cc7d" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "jobs" ("id" text NOT NULL, "user_id" text, "company" text NOT NULL, "is_product_company" boolean NOT NULL, "job_post_link" text NOT NULL, "salary_range" text, "salary_expectations" text, "applied_at" TIMESTAMP WITH TIME ZONE NOT NULL, "cv" text NOT NULL, "role_option_id" text, "level_option_id" text, "type_option_id" text, "status" text NOT NULL, "outcome" text, "notes" text, "application_questions" text, "custom_fields" jsonb NOT NULL DEFAULT '{}'::jsonb, "archived_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_cf0a6c42b72fcc7f7c237def345" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9027c8f0ba75fbc1ac46647d04" ON "jobs" ("user_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "job_field_definitions" ("id" text NOT NULL, "user_id" text, "key" text NOT NULL, "label" text NOT NULL, "type" text NOT NULL, "options" jsonb, "required" boolean NOT NULL DEFAULT false, "sort_order" integer NOT NULL DEFAULT '0', "archived_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_dbab23682a1f25b610b6f3e8dfb" UNIQUE ("user_id", "key"), CONSTRAINT "PK_bdf4658f94a322c8b6f4c8cba69" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f3ac94f197d2fd5b3f605ad796" ON "job_field_definitions" ("user_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "form_layouts" ("user_id" text NOT NULL, "layout" jsonb NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_ac91d3e565c6f36d09bda465231" PRIMARY KEY ("user_id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "cv_versions" ("id" text NOT NULL, "user_id" text, "name" text NOT NULL, "description" text, "attachment" text, "source_link" text, "enabled" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_ebe09a83520bfa3c586e6efffa1" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e21272b64d4f4c1badf1d7eaf4" ON "cv_versions" ("user_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" text NOT NULL, "email" text NOT NULL, "display_name" text, "avatar_url" text, "google_id" text, "role" text NOT NULL DEFAULT 'user', "ai_call_count" integer NOT NULL DEFAULT '0', "ai_call_date" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_0bd5012aeb82628e07f6a1be53b" UNIQUE ("google_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_fab1e2943b6fa7e3c2270579e64" FOREIGN KEY ("role_option_id") REFERENCES "job_roles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_3893bdc071baa9dd16d1254bcf9" FOREIGN KEY ("level_option_id") REFERENCES "job_levels"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_ffaa531658c08b6072e1e8217d8" FOREIGN KEY ("type_option_id") REFERENCES "job_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP CONSTRAINT "FK_ffaa531658c08b6072e1e8217d8"`
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP CONSTRAINT "FK_3893bdc071baa9dd16d1254bcf9"`
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP CONSTRAINT "FK_fab1e2943b6fa7e3c2270579e64"`
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e21272b64d4f4c1badf1d7eaf4"`
    );
    await queryRunner.query(`DROP TABLE "cv_versions"`);
    await queryRunner.query(`DROP TABLE "form_layouts"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f3ac94f197d2fd5b3f605ad796"`
    );
    await queryRunner.query(`DROP TABLE "job_field_definitions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9027c8f0ba75fbc1ac46647d04"`
    );
    await queryRunner.query(`DROP TABLE "jobs"`);
    await queryRunner.query(`DROP TABLE "job_types"`);
    await queryRunner.query(`DROP TABLE "job_levels"`);
    await queryRunner.query(`DROP TABLE "job_roles"`);
  }
}
