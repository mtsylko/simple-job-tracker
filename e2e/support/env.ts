import path from 'node:path';

const apiPort = Number(process.env.E2E_API_PORT ?? 3190);
const accountsPort = Number(process.env.E2E_ACCOUNTS_PORT ?? 3191);
const frontPort = Number(process.env.E2E_FRONT_PORT ?? 5290);

export const API_URL = `http://localhost:${apiPort}`;
export const ACCOUNTS_URL = `http://127.0.0.1:${accountsPort}`;
export const ACCOUNTS_PORT = accountsPort;
export const FRONT_URL = `http://localhost:${frontPort}`;
export const FRONT_PORT = frontPort;

const E2E_ROOT = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(E2E_ROOT, '.cache');
export const REPO_ROOT = path.resolve(E2E_ROOT, '..');
/** The API build that both the API and the accounts server run. */
export const API_BUILD_DIR = path.join(CACHE_DIR, 'api');
/** The front-end bundle `vite preview` serves. */
export const FRONT_BUILD_DIR = path.join(CACHE_DIR, 'front');

/** The docker Postgres from `docker-compose.yml`, holding its own throwaway database. */
export const POSTGRES_URL =
  process.env.E2E_POSTGRES_URL ??
  'postgres://postgres:postgres@localhost:5432/postgres';
export const DATABASE_NAME = 'job_tracker_e2e';

/** Set in full so nothing falls through to `web-api/.env`: no real Google client, AI key or admins. */
export const API_ENV = {
  DATABASE_URL: withDatabase(POSTGRES_URL, DATABASE_NAME),
  PORT: String(apiPort),
  JWT_SECRET: 'e2e-secret',
  GOOGLE_CLIENT_ID: 'e2e-client-id',
  GOOGLE_CLIENT_SECRET: 'e2e-client-secret',
  GOOGLE_CALLBACK_URL: `${FRONT_URL}/auth/google/callback`,
  FRONTEND_URL: FRONT_URL,
  ADMIN_EMAILS: '',
  ANTHROPIC_API_KEY: '',
  LOG_LEVEL: 'warn'
};

function withDatabase(url: string, database: string): string {
  const parsed = new URL(url);
  parsed.pathname = `/${database}`;
  return parsed.toString();
}
