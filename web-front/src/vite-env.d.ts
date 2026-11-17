/// <reference types="vite/client" />

interface ImportMetaEnv {
  // GA4 measurement ID (`G-XXXXXXXXXX`). Unset disables analytics entirely.
  readonly VITE_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
