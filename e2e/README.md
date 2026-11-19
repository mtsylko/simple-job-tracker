# e2e

Browser tests of the main flow, written with Playwright. They run the real
API and the built front end against a throwaway database.

## Run

The docker Postgres must be up (`docker compose up -d postgres`). Use Node 22.

```bash
yarn workspace job-tracker-e2e test
```

The first run needs the browser: `yarn workspace job-tracker-e2e playwright install chromium`.
To watch the tests, add `--ui` or `--headed`.

## What a run starts

`playwright.config.ts` starts three servers, one after another:

| Server     | Port | What it does                                                                                           |
| ---------- | ---- | ------------------------------------------------------------------------------------------------------ |
| `api`      | 3190 | Drops and creates the `job_tracker_e2e` database, builds the API into `.cache/api`, runs it            |
| `accounts` | 3191 | Creates test accounts with the API's own `AuthService`, the same code the Google callback runs          |
| `front`    | 5290 | Builds `web-front` into `.cache/front` and serves it with `vite preview`, proxying to the API on 3190 |

Change the ports with `E2E_API_PORT`, `E2E_ACCOUNTS_PORT` and `E2E_FRONT_PORT`,
and the Postgres server with `E2E_POSTGRES_URL`. The API gets its whole
environment from `support/env.ts` and never reads `web-api/.env`.

## Sign-in

Google cannot be part of a test. Each test gets a fresh account from the
accounts server and puts its JWT in the `access_token` cookie, as the Google
callback does. The tests check our side of the sign-in: the redirect to Google
with our client and callback, the session and the sign-out. The code exchange
in `/auth/google/callback` is not covered here.

## Writing a test

- Import `test` and `expect` from `support/fixtures`. Lint stops a direct
  import of `test` from `@playwright/test`.
- Every test has its own account: onboarded with the `software` preset and one
  CV (`SEED`). Tests do not share data, so they run in parallel and clean up
  nothing.
- Prepare data through `api` (`support/app-api.ts`). Use the UI only for what
  the test checks.
- Find elements by role and label, as a user sees them. The browser locale is
  `en-US`, so the English copy is stable.
- Wait with web-first assertions (`await expect(…).toBeVisible()`), never with
  `waitForTimeout`.
- Add a test only for a step of the main flow. Filters, sorting and edge cases
  belong in unit tests.

## When the UI changes

A deliberate UI change updates these tests in the same change. A failure
nobody meant to cause is a bug in the app, so fix the app.

