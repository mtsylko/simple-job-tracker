import { useAppFooterActionNode } from './app-footer-action-hooks';

export function AppFooterActionPanel() {
  const actionNode = useAppFooterActionNode();

  if (!actionNode) {
    return null;
  }

  return (
    <footer className="sticky bottom-0 z-4 border-t border-border bg-background/90 backdrop-blur-[10px] backdrop-saturate-[140%]">
      <div className="flex w-full items-center px-4 py-3.5 sm:px-7">
        {actionNode}
      </div>
    </footer>
  );
}
