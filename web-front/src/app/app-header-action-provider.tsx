import { type ReactNode, useMemo, useState } from 'react';

import { AppHeaderActionContext } from './app-header-action-context';

export function AppHeaderActionProvider({ children }: { children: ReactNode }) {
  const [actionNode, setActionNode] = useState<ReactNode>(null);

  const contextValue = useMemo(
    () => ({
      actionNode,
      setActionNode
    }),
    [actionNode]
  );

  return (
    <AppHeaderActionContext.Provider value={contextValue}>
      {children}
    </AppHeaderActionContext.Provider>
  );
}
