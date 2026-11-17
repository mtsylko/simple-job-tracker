import type { TranslationOverride } from '@job-tracker/shared';

import { LANGUAGES, type Language } from '@/app/language';
import { bundledResources } from '@/i18n';

export type Namespace = keyof (typeof bundledResources)['en'];

type LabelledNamespace =
  keyof (typeof bundledResources)['en']['adminTranslations']['namespaces'];

/** The section's readable name in `adminTranslations`; a namespace shipped without one fails the build here. */
export function sectionLabelKey(
  namespace: Namespace
): `namespaces.${LabelledNamespace}` {
  return `namespaces.${namespace}`;
}

/** One string the app ships, in every language that has it. */
export type TranslationRow = {
  /** `namespace:key`, unique across the catalog. */
  id: string;
  namespace: Namespace;
  key: string;
  /** Absent where a language has no such key, e.g. English for a Polish-only plural form. */
  defaults: Partial<Record<Language, string>>;
  overrides: Partial<Record<Language, TranslationOverride>>;
};

function collectLeaves(
  node: unknown,
  prefix: string,
  visit: (key: string, text: string) => void
): void {
  if (typeof node === 'string') {
    visit(prefix, node);
    return;
  }
  if (typeof node !== 'object' || node === null) return;
  for (const [part, child] of Object.entries(node)) {
    collectLeaves(child, prefix ? `${prefix}.${part}` : part, visit);
  }
}

function rowId(namespace: string, key: string): string {
  return `${namespace}:${key}`;
}

/** Every shipped key, sorted so plural forms sit together. */
const CATALOG: readonly Omit<TranslationRow, 'overrides'>[] = (() => {
  const byId = new Map<string, Omit<TranslationRow, 'overrides'>>();

  for (const language of LANGUAGES) {
    for (const [name, tree] of Object.entries(bundledResources[language])) {
      const namespace = name as Namespace;
      collectLeaves(tree, '', (key, text) => {
        const id = rowId(namespace, key);
        const entry = byId.get(id) ?? { id, namespace, key, defaults: {} };
        entry.defaults[language] = text;
        byId.set(id, entry);
      });
    }
  }

  return [...byId.values()].sort(
    (a, b) =>
      a.namespace.localeCompare(b.namespace) || a.key.localeCompare(b.key)
  );
})();

export const NAMESPACES: readonly Namespace[] = [
  ...new Set(CATALOG.map((row) => row.namespace))
];

/** The catalog with each edit attached; edits whose key the app no longer ships come back apart. */
export function buildRows(overrides: readonly TranslationOverride[]): {
  rows: TranslationRow[];
  orphans: TranslationOverride[];
} {
  const byId = new Map<string, TranslationOverride[]>();
  for (const override of overrides) {
    const id = rowId(override.namespace, override.key);
    byId.set(id, [...(byId.get(id) ?? []), override]);
  }

  const orphans: TranslationOverride[] = [];
  const rows = CATALOG.map((entry) => {
    const found: TranslationRow['overrides'] = {};
    for (const override of byId.get(entry.id) ?? []) {
      if (entry.defaults[override.language] === undefined) {
        orphans.push(override);
      } else {
        found[override.language] = override;
      }
    }
    byId.delete(entry.id);
    return { ...entry, overrides: found };
  });

  for (const rest of byId.values()) orphans.push(...rest);
  return { rows, orphans };
}

/** What the app shows for the row in one language right now. */
export function currentText(
  row: TranslationRow,
  language: Language
): string | undefined {
  return row.overrides[language]?.value ?? row.defaults[language];
}

export function isEdited(row: TranslationRow): boolean {
  return Object.keys(row.overrides).length > 0;
}

export type SectionLabels = Record<Namespace, string>;

/** Sections in the order of their readable names, keys in order within each. */
export function sortBySection(
  rows: readonly TranslationRow[],
  labels: SectionLabels
): TranslationRow[] {
  return [...rows].sort(
    (a, b) =>
      labels[a.namespace].localeCompare(labels[b.namespace]) ||
      a.key.localeCompare(b.key)
  );
}

export function matchesQuery(row: TranslationRow, query: string): boolean {
  if (!query) return true;
  if (row.id.toLowerCase().includes(query)) return true;
  return LANGUAGES.some((language) =>
    currentText(row, language)?.toLowerCase().includes(query)
  );
}

const TOKEN_PATTERN = /\{\{\s*[^{}]+?\s*\}\}|<\/?[\w-]+\s*\/?>/g;

function tokensOf(text: string): Set<string> {
  return new Set(
    [...text.matchAll(TOKEN_PATTERN)].map((match) =>
      match[0].replace(/\s+/g, '')
    )
  );
}

/** `{{name}}` interpolations and `<1>` tags an edit drops or adds, compared with the shipped text. */
export function compareTokens(
  shipped: string,
  value: string
): { missing: string[]; unknown: string[] } {
  const expected = tokensOf(shipped);
  const actual = tokensOf(value);
  return {
    missing: [...expected].filter((token) => !actual.has(token)),
    unknown: [...actual].filter((token) => !expected.has(token))
  };
}
