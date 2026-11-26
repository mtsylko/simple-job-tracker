import { MigrationInterface, QueryRunner } from 'typeorm';

/** A company's own page keeps a website and notes beside its blacklist entry. */
export class CompanyWebsiteNotes1787276380000 implements MigrationInterface {
  name = 'CompanyWebsiteNotes1787276380000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "companies" ADD "website" text`);
    await queryRunner.query(`ALTER TABLE "companies" ADD "notes" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "notes"`);
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "website"`);
  }
}
