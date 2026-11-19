import { defineConfig, devices } from '@playwright/test';

import {
  ACCOUNTS_PORT,
  ACCOUNTS_URL,
  API_BUILD_DIR,
  API_ENV,
  API_URL,
  DATABASE_NAME,
  FRONT_BUILD_DIR,
  FRONT_PORT,
  FRONT_URL,
  POSTGRES_URL,
  REPO_ROOT
} from './support/env';

const isCI = Boolean(process.env.CI);

const serverEnv = {
  ...API_ENV,
  E2E_API_BUILD_DIR: API_BUILD_DIR,
  E2E_ACCOUNTS_PORT: String(ACCOUNTS_PORT),
  E2E_POSTGRES_URL: POSTGRES_URL,
  E2E_DATABASE_NAME: DATABASE_NAME
};

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : 'list',
  expect: { timeout: 10_000 },
  use: {
    baseURL: FRONT_URL,
    // The app picks its language from the browser, so the copy the tests look for stays English.
    locale: 'en-US',
    timezoneId: 'Europe/Warsaw',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Started in order, each once the one before answers.
  webServer: [
    {
      name: 'api',
      command: 'node scripts/start-api.mjs',
      // A 401 counts as up: migrations have run and the auth guard answers.
      url: `${API_URL}/auth/me`,
      env: serverEnv,
      // Never someone else's API: the tests own this database.
      reuseExistingServer: false,
      timeout: 180_000,
      stdout: 'ignore',
      stderr: 'pipe'
    },
    {
      name: 'accounts',
      command: 'node scripts/start-accounts.mjs',
      url: ACCOUNTS_URL,
      env: serverEnv,
      reuseExistingServer: false,
      timeout: 60_000,
      stderr: 'pipe'
    },
    {
      name: 'front',
      // The built bundle, as in production: a dev server compiles each module per browser on demand.
      command: [
        `yarn workspace web-front vite build --outDir ${FRONT_BUILD_DIR} --emptyOutDir --logLevel warn`,
        `yarn workspace web-front vite preview --outDir ${FRONT_BUILD_DIR} --port ${FRONT_PORT} --strictPort`
      ].join(' && '),
      cwd: REPO_ROOT,
      url: FRONT_URL,
      // The preview proxies `/api`, `/auth` and `/uploads` to this API, as the dev server would.
      env: { VITE_API_URL: API_URL, VITE_GA_MEASUREMENT_ID: '' },
      reuseExistingServer: false,
      timeout: 180_000
    }
  ]
});
