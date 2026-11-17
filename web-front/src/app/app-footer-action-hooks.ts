import { type ReactNode, useContext, useEffect } from 'react';

import { AppFooterActionContext } from './app-footer-action-context';

function useAppFooterActionContext() {
  const context = useContext(AppFooterActionContext);
  if (!context) {
    throw new Error(
      'useAppFooterActionContext must be used within AppFooterActionProvider.'
    );
  }

  return context;
}

export function useAppFooterAction(actionNode: ReactNode) {
  const { setActionNode } = useAppFooterActionContext();

  useEffect(() => {
    setActionNode(actionNode);

    return () => {
      setActionNode(null);
    };
  }, [actionNode, setActionNode]);
}

export function useAppFooterActionNode() {
  const { actionNode } = useAppFooterActionContext();
  return actionNode;
}
