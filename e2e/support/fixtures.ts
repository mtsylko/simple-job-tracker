import {
  test as base,
  type APIRequest,
  type APIRequestContext
} from '@playwright/test';

import { createAccount, type Account } from './accounts';
import { AppApi } from './app-api';
import { API_URL, FRONT_URL } from './env';

/** What every account starts with: onboarding done with these values, and one CV. */
export const SEED = {
  role: 'Frontend Engineer',
  levels: ['Middle', 'Senior'],
  types: ['Remote', 'Hybrid', 'On-site'],
  cv: 'Frontend CV'
} as const;

type Options = {
  /** Off for the pages a visitor sees before signing in. */
  signedIn: boolean;
};

type TestFixtures = {
  /** A fresh, onboarded account per test, so no test sees another's data. */
  user: Account;
  /** The API, signed in as `user`. */
  api: AppApi;
};

export const test = base.extend<Options & TestFixtures>({
  signedIn: [true, { option: true }],

  user: async ({ playwright }, use) => {
    const account = await createAccount();
    const request = await signedInRequest(playwright.request, account);
    const api = new AppApi(request);
    await api.applyPreset({
      key: 'software',
      specializations: ['frontend'],
      roles: [SEED.role],
      levels: [...SEED.levels],
      types: [...SEED.types],
      customFields: []
    });
    await api.createCvVersion({ name: SEED.cv });
    await request.dispose();
    await use(account);
  },

  api: async ({ playwright, user }, use) => {
    const request = await signedInRequest(playwright.request, user);
    await use(new AppApi(request));
    await request.dispose();
  },

  context: async ({ context, signedIn, user }, use) => {
    if (signedIn) {
      await context.addCookies([
        { name: 'access_token', value: user.token, url: FRONT_URL }
      ]);
    }
    await use(context);
  }
});

export { expect } from '@playwright/test';

function signedInRequest(
  request: APIRequest,
  account: Account
): Promise<APIRequestContext> {
  return request.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: { cookie: `access_token=${account.token}` }
  });
}
