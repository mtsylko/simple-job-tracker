import type { TranslationOverrideBundle } from '@job-tracker/shared';

import { isLanguage, type Language } from '@/app/language';
import i18n, { bundledResources } from '@/i18n';

const ENDPOINT = '/api/translations';

/** The shipped copy at a dotted key, or undefined when the app has no string there. */
export function bundledText(
  language: Language,
  namespace: string,
  key: string
): string | undefined {
  let node: unknown = (bundledResources[language] as Record<string, unknown>)[
    namespace
  ];
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/** Puts an admin's text into the live copy, or the shipped text back when `value` is null. */
export function applyTranslationOverride(
  language: Language,
  namespace: string,
  key: string,
  value: string | null
): void {
  const shipped = bundledText(language, namespace, key);
  // A key the app no longer ships is skipped, so a stale row cannot replace a whole subtree.
  if (shipped === undefined) return;
  i18n.addResource(language, namespace, key, value ?? shipped);
}

function applyBundle(bundle: TranslationOverrideBundle): void {
  for (const [language, namespaces] of Object.entries(bundle)) {
    if (!isLanguage(language) || !namespaces) continue;

    for (const [namespace, entries] of Object.entries(namespaces)) {
      const known = Object.fromEntries(
        Object.entries(entries).filter(
          ([key]) => bundledText(language, namespace, key) !== undefined
        )
      );
      // One store event per namespace, so the page re-renders once rather than per string.
      i18n.addResources(language, namespace, known);
    }
  }
}

/** Lays the admin's edits over the shipped copy; on any failure the shipped copy stays. */
export async function loadTranslationOverrides(): Promise<void> {
  try {
    const response = await fetch(ENDPOINT);
    if (!response.ok) return;
    applyBundle((await response.json()) as TranslationOverrideBundle);
  } catch {
    // Offline or the API is down: the bundled copy is complete on its own.
  }
}
