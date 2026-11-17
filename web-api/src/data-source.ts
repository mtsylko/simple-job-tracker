import 'reflect-metadata';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { DataSource } from 'typeorm';

// The CLI does not boot Nest, so it loads the same env files main.ts does.
for (const envPath of [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'web-api/.env')
]) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

/**
 * Standalone DataSource for the TypeORM CLI (generate/run/revert). It has no
 * access to Nest's `autoLoadEntities`, so entities and migrations are globbed by
 * path. `__dirname` resolves to `src` under ts-node and `dist` once compiled, so
 * the `{ts,js}` globs cover both without branching on the environment.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url:
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    'postgres://postgres:postgres@localhost:5432/job_tracker',
  entities: [path.join(__dirname, '**', '*.entity.{ts,js}')],
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false
});
