import { createContext, type ReactNode } from 'react';

export type AppHeaderActionContextValue = {
  actionNode: ReactNode;
  setActionNode: (next: ReactNode) => void;
};

export const AppHeaderActionContext =
  createContext<AppHeaderActionContextValue | null>(null);
