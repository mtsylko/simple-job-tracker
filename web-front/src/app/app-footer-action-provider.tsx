import { type ReactNode, useMemo, useState } from 'react';

import { AppFooterActionContext } from './app-footer-action-context';

export function AppFooterActionProvider({ children }: { children: ReactNode }) {
  const [actionNode, setActionNode] = useState<ReactNode>(null);

  const contextValue = useMemo(
    () => ({
      actionNode,
      setActionNode
    }),
    [actionNode]
  );

  return (
    <AppFooterActionContext.Provider value={contextValue}>
      {children}
    </AppFooterActionContext.Provider>
  );
}
