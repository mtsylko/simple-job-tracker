import { ACCOUNTS_URL } from './env';

export type Account = {
  id: string;
  email: string;
  displayName: string;
  /** The session cookie's value, as the Google callback would have set it. */
  token: string;
};

/** A new account from `scripts/start-accounts.mjs`, signed up the way Google sign-in does it. */
export async function createAccount(): Promise<Account> {
  const response = await fetch(`${ACCOUNTS_URL}/accounts`, { method: 'POST' });
  if (!response.ok) {
    throw new Error(
      `Could not create a test account (${response.status}): ${await response.text()}`
    );
  }
  return (await response.json()) as Account;
}
