import { createContext, type ReactNode } from 'react';

export type AppFooterActionContextValue = {
  actionNode: ReactNode;
  setActionNode: (next: ReactNode) => void;
};

export const AppFooterActionContext =
  createContext<AppFooterActionContextValue | null>(null);
