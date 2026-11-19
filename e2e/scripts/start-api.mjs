// @ts-check
// Playwright's API web server: a fresh database, a fresh build, then the API in this process.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const e2eRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const repoRoot = path.resolve(e2eRoot, '..');
const buildDir = required('E2E_API_BUILD_DIR');
// Outside the repo: Express's sendFile answers 404 for any path with a dot-segment, `.claude/` included.
const runDir = path.join(tmpdir(), `job-tracker-e2e-${required('PORT')}`);

await recreateDatabase(
  required('E2E_POSTGRES_URL'),
  required('E2E_DATABASE_NAME')
);
buildApi();

// The API reads `.env` and writes `uploads/` relative to its cwd, so both stay in here.
rmSync(runDir, { recursive: true, force: true });
mkdirSync(runDir, { recursive: true });
process.chdir(runDir);
createRequire(import.meta.url)(path.join(buildDir, 'main.js'));

/** @param {string} name */
function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set; run the tests through playwright.config.ts`
    );
  }
  return value;
}

/**
 * @param {string} serverUrl
 * @param {string} database
 */
async function recreateDatabase(serverUrl, database) {
  const client = new pg.Client({ connectionString: serverUrl });
  try {
    await client.connect();
  } catch (error) {
    throw new Error(
      `Postgres is not reachable at ${serverUrl}; start it with \`docker compose up -d postgres\``,
      { cause: error }
    );
  }
  await client.query(`DROP DATABASE IF EXISTS ${database} WITH (FORCE)`);
  await client.query(`CREATE DATABASE ${database}`);
  await client.end();
}

// Built outside the shared repo-root `dist/`, where migrations from other branches linger.
function buildApi() {
  const yarn = (/** @type {string[]} */ ...args) =>
    execFileSync('yarn', args, { cwd: repoRoot, stdio: 'inherit' });

  yarn('workspace', '@job-tracker/shared', 'build');
  rmSync(buildDir, { recursive: true, force: true });
  execFileSync(
    path.join(repoRoot, 'node_modules', '.bin', 'tsc'),
    ['-p', 'web-api/tsconfig.json', '--outDir', buildDir],
    { cwd: repoRoot, stdio: 'inherit' }
  );
  // tsc emits only JS; the AI prompts are markdown beside the sources.
  cpSync(path.join(repoRoot, 'web-api', 'src'), buildDir, {
    recursive: true,
    filter: (source) => !path.extname(source) || source.endsWith('.md')
  });
}
