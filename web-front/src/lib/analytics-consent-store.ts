import { create } from 'zustand';

export type AnalyticsConsent = 'granted' | 'denied';

const CONSENT_STORAGE_KEY = 'jt-analytics-consent';

function readStoredConsent(): AnalyticsConsent | null {
  try {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return stored === 'granted' || stored === 'denied' ? stored : null;
  } catch {
    // Blocked storage asks again on every visit, which is the safe side.
    return null;
  }
}

function storeConsent(choice: AnalyticsConsent): void {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // The choice still holds for this page load.
  }
}

type AnalyticsConsentState = {
  // null until the visitor answers the banner.
  choice: AnalyticsConsent | null;
  // The banner was reopened from "Cookie settings" after a choice was made.
  reviewing: boolean;
  choose: (choice: AnalyticsConsent) => void;
  review: () => void;
};

export const useAnalyticsConsentStore = create<AnalyticsConsentState>(
  (set) => ({
    choice: readStoredConsent(),
    reviewing: false,
    choose(choice) {
      storeConsent(choice);
      set({ choice, reviewing: false });
    },
    review() {
      set({ reviewing: true });
    }
  })
);
