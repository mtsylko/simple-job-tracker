// @ts-check
// Signs test accounts up through the API's own AuthService, as a Google sign-in would, minus Google.
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';

// Resolved from the API build, so Nest's DI sees the same copy of each package.
const requireFromApi = createRequire(
  path.join(required('E2E_API_BUILD_DIR'), 'main.js')
);
requireFromApi('reflect-metadata');
const { NestFactory } = requireFromApi('@nestjs/core');
const { AppModule } = requireFromApi('./app.module');
const { AuthService } = requireFromApi('./auth/auth.service');

const app = await NestFactory.createApplicationContext(AppModule, {
  logger: false
});
const auth = app.get(AuthService);

const server = createServer((request, response) => {
  if (request.method === 'GET') {
    // Playwright's readiness probe.
    response.writeHead(204).end();
    return;
  }
  if (request.method !== 'POST' || request.url !== '/accounts') {
    response.writeHead(404).end();
    return;
  }
  createAccount().then(
    (account) => {
      response.writeHead(201, { 'content-type': 'application/json' });
      response.end(JSON.stringify(account));
    },
    (error) => {
      response.writeHead(500, { 'content-type': 'text/plain' });
      response.end(error instanceof Error ? error.stack : String(error));
    }
  );
});
server.listen(Number(required('E2E_ACCOUNTS_PORT')), '127.0.0.1');

process.on('SIGTERM', () => {
  server.close();
  void app.close();
});

async function createAccount() {
  const id = randomUUID();
  const email = `e2e-${id}@example.test`;
  const displayName = 'E2E User';
  const user = await auth.findOrCreateGoogleUser({
    googleId: `e2e-${id}`,
    email,
    displayName,
    avatarUrl: null
  });
  return { id: user.id, email, displayName, token: auth.signJwt(user) };
}

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
