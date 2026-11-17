import { MigrationInterface, QueryRunner } from 'typeorm';

/** Admin edits laid over the web app's shipped copy, one row per language and key. */
export class TranslationOverrides1787276350000 implements MigrationInterface {
  name = 'TranslationOverrides1787276350000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "translation_overrides" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "language" text NOT NULL,
        "namespace" text NOT NULL,
        "key" text NOT NULL,
        "value" text NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_translation_overrides" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_translation_overrides_key" UNIQUE ("language", "namespace", "key")
      )`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "translation_overrides"`);
  }
}
