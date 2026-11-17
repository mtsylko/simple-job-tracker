import { useEffect } from 'react';

import { clearViewAs } from '@/lib/view-as';

import { SignInBrandPanel } from './components/SignInBrandPanel';
import { SignInPanel } from './components/SignInPanel';

export function SignInPage() {
  // Logging out lands here, so the next account in this tab never inherits an admin's view.
  useEffect(() => {
    clearViewAs();
  }, []);

  return (
    <div className="flex min-h-0 flex-1 overflow-y-auto bg-warm-bg">
      <div className="grid min-h-svh w-full grid-cols-1 lg:grid-cols-2">
        <SignInBrandPanel />
        <main className="flex items-center justify-center px-8 py-14">
          <SignInPanel />
        </main>
      </div>
    </div>
  );
}
