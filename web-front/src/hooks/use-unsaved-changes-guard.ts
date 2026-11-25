import { useCallback, useRef } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router-dom';

const BEFORE_UNLOAD_OPTIONS = { capture: true } as const;

/**
 * Holds every way off an edited form: in-app links, the browser's back button
 * and the tab's close or reload. The page shows its dialog while `isBlocked`
 * and answers it with `keepEditing` or `discard`. `release` lets the one
 * navigation that follows a save through.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  const released = useRef(false);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      !released.current &&
      currentLocation.pathname !== nextLocation.pathname
  );

  useBeforeUnload(
    useCallback(
      (event: BeforeUnloadEvent) => {
        if (isDirty && !released.current) event.preventDefault();
      },
      [isDirty]
    ),
    BEFORE_UNLOAD_OPTIONS
  );

  return {
    isBlocked: blocker.state === 'blocked',
    keepEditing: () => {
      if (blocker.state === 'blocked') blocker.reset();
    },
    discard: () => {
      if (blocker.state === 'blocked') blocker.proceed();
    },
    release: () => {
      released.current = true;
    },
    /** Undoes `release` when the save it was called for failed. */
    hold: () => {
      released.current = false;
    }
  };
}
