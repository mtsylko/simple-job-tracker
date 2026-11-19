import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { DataSource, type DataSourceOptions } from 'typeorm';

const SRC = path.resolve(__dirname, '../../src');

/** The docker Postgres from `docker-compose.yml`; CI starts one as a service. */
const SERVER_URL =
  process.env.TEST_POSTGRES_URL ??
  'postgres://postgres:postgres@localhost:5432/postgres';

export type TestDatabase = {
  dataSource: DataSource;
  drop(): Promise<void>;
};

function sourceFiles(match: (file: string) => boolean): string[] {
  return readdirSync(SRC, { recursive: true, encoding: 'utf8' })
    .filter(match)
    .map((file) => path.join(SRC, file));
}

/** Every class the files export: entities, or one migration per file. */
async function classesIn(files: string[]): Promise<unknown[]> {
  const modules = await Promise.all(
    files.map((file) => import(file) as Promise<Record<string, unknown>>)
  );
  return modules.flatMap((module) =>
    Object.values(module).filter((value) => typeof value === 'function')
  );
}

/** A database of its own for one test file, migrated the way prod is. */
export async function createTestDatabase(): Promise<TestDatabase> {
  const name = `job_tracker_test_${randomUUID().replaceAll('-', '').slice(0, 16)}`;
  const server = new DataSource({ type: 'postgres', url: SERVER_URL });
  await server.initialize();
  await server.query(`CREATE DATABASE "${name}"`);

  const url = new URL(SERVER_URL);
  url.pathname = `/${name}`;
  const dataSource = new DataSource({
    type: 'postgres',
    url: url.toString(),
    entities: (await classesIn(
      sourceFiles((file) => file.endsWith('.entity.ts'))
    )) as DataSourceOptions['entities'],
    migrations: (await classesIn(
      sourceFiles(
        (file) => path.dirname(file) === 'migrations' && file.endsWith('.ts')
      )
    )) as DataSourceOptions['migrations'],
    synchronize: false
  });
  await dataSource.initialize();
  await dataSource.runMigrations();

  return {
    dataSource,
    async drop() {
      await dataSource.destroy();
      await server.query(`DROP DATABASE "${name}" WITH (FORCE)`);
      await server.destroy();
    }
  };
}
