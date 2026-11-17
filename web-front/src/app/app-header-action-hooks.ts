import { type ReactNode, useContext, useEffect } from 'react';

import { AppHeaderActionContext } from './app-header-action-context';

function useAppHeaderActionContext() {
  const context = useContext(AppHeaderActionContext);
  if (!context) {
    throw new Error(
      'useAppHeaderActionContext must be used within AppHeaderActionProvider.'
    );
  }

  return context;
}

export function useAppHeaderAction(actionNode: ReactNode) {
  const { setActionNode } = useAppHeaderActionContext();

  useEffect(() => {
    setActionNode(actionNode);

    return () => {
      setActionNode(null);
    };
  }, [actionNode, setActionNode]);
}

export function useAppHeaderActionNode() {
  const { actionNode } = useAppHeaderActionContext();
  return actionNode;
}
