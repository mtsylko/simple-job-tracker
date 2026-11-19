import { API_ENV, FRONT_URL } from '../support/env';
import { expect, test } from '../support/fixtures';

test.describe('signed out', () => {
  test.use({ signedIn: false });

  test('sends a visitor to the sign-in page', async ({ page }) => {
    await page.goto('/applications');

    await expect(page).toHaveURL('/sign-in?returnTo=%2Fapplications');
    await expect(
      page.getByRole('heading', { name: 'Welcome back' })
    ).toBeVisible();
  });

  test('hands the Google button to Google with our client and callback', async ({
    page
  }) => {
    // Google itself stays out of the test: its sign-in page is answered here.
    await page.route('https://accounts.google.com/**', (route) =>
      route.fulfill({ contentType: 'text/html', body: 'Google sign-in' })
    );
    const googleRequest = page.waitForRequest('https://accounts.google.com/**');

    await page.goto('/sign-in');
    await page.getByRole('button', { name: 'Continue with Google' }).click();

    const params = new URL((await googleRequest).url()).searchParams;
    expect(params.get('client_id')).toBe(API_ENV.GOOGLE_CLIENT_ID);
    expect(params.get('redirect_uri')).toBe(API_ENV.GOOGLE_CALLBACK_URL);
    expect(params.get('scope')?.split(' ')).toEqual(['email', 'profile']);
  });

  test('opens the page it was sent away from once signed in', async ({
    page,
    context,
    user
  }) => {
    await page.route('https://accounts.google.com/**', (route) =>
      route.fulfill({ contentType: 'text/html', body: 'Google sign-in' })
    );

    await page.goto('/analytics');
    await expect(page).toHaveURL('/sign-in?returnTo=%2Fanalytics');
    await page.getByRole('button', { name: 'Continue with Google' }).click();
    await page.waitForURL('https://accounts.google.com/**');

    // What the Google callback does: set the session cookie and land on the home page.
    await context.addCookies([
      { name: 'access_token', value: user.token, url: FRONT_URL }
    ]);
    await page.goto('/');

    await expect(page).toHaveURL('/analytics');
  });
});

test.describe('signed in', () => {
  test('opens the app for the account in the session', async ({
    page,
    user
  }) => {
    await page.goto('/');

    await expect(page).toHaveURL('/applications');
    await expect(
      page.getByRole('heading', { name: 'Applications', level: 1 })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Account and preferences' })
    ).toContainText(user.email);
  });

  test('signs out and keeps the app closed afterwards', async ({ page }) => {
    await page.goto('/applications');

    await page.getByRole('button', { name: 'Account and preferences' }).click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();

    await expect(page).toHaveURL('/sign-in');
    await page.goto('/applications');
    await expect(page).toHaveURL('/sign-in?returnTo=%2Fapplications');
  });
});
