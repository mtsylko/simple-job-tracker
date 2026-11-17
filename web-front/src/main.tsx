import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import { loadTranslationOverrides } from './lib/translation-overrides';
// Registers the OS-appearance listener app-wide. Imported here rather than
// pulled in by the sidebar menu alone, which only mounts behind the auth gate —
// the sign-in screen should follow a system theme change too.
import './app/theme-store';
import App from './App.tsx';

// Not awaited: the shipped copy paints first and admin edits replace it when they land.
void loadTranslationOverrides();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
