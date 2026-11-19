import { ROUTES } from '@/app/routes';

const RETURN_TO_PARAM = 'returnTo';
// Google sends the user back to `/`, so the page to reopen waits in this tab's session storage.
const RETURN_TO_KEY = 'jt.returnTo';

/** A path inside the app; never `//host` or a URL that would leave it. */
function isAppPath(value: string | null | undefined): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.startsWith('/\\')
  );
}

/** The sign-in page, told to reopen `path` once the user is back. */
export function signInPath(path: string): string {
  if (!isAppPath(path) || path === ROUTES.home) {
    return ROUTES.signIn;
  }
  const query = new URLSearchParams({ [RETURN_TO_PARAM]: path });
  return `${ROUTES.signIn}?${query.toString()}`;
}

let redirecting = false;

/** A 401 means the session cookie expired: sign in again and come back to this page. */
export function redirectIfSignedOut(status: number): void {
  if (status !== 401 || redirecting) {
    return;
  }
  const { pathname, search, hash } = window.location;
  if (pathname === ROUTES.signIn) {
    return;
  }
  redirecting = true;
  window.location.assign(signInPath(pathname + search + hash));
}

/** Called as sign-in starts, with the sign-in page's own query string. */
export function keepReturnTo(search: string): void {
  const target = new URLSearchParams(search).get(RETURN_TO_PARAM);
  try {
    if (isAppPath(target)) {
      sessionStorage.setItem(RETURN_TO_KEY, target);
    } else {
      sessionStorage.removeItem(RETURN_TO_KEY);
    }
  } catch {
    // Storage blocked: sign-in lands on the home page.
  }
}

/** The page to reopen after sign-in, if one is waiting. */
export function peekReturnTo(): string | null {
  try {
    const target = sessionStorage.getItem(RETURN_TO_KEY);
    return isAppPath(target) ? target : null;
  } catch {
    return null;
  }
}

export function clearReturnTo(): void {
  try {
    sessionStorage.removeItem(RETURN_TO_KEY);
  } catch {
    // Nothing was stored either.
  }
}
