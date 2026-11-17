import { useEffect } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ViewAsBanner } from '@/features/admin-users/components/ViewAsBanner';
import type { CurrentUser } from '@/features/auth/use-current-user';
import { FeedbackLauncher } from '@/features/feedback/components/FeedbackLauncher';
import { useTaxonomyStore } from '@/features/taxonomies/taxonomy-store';

import { AppFooterActionPanel } from './AppFooterActionPanel';
import { AppFooterActionProvider } from './app-footer-action-provider';
import { AppHeaderActionProvider } from './app-header-action-provider';

export function AppLayout() {
  const { t } = useTranslation('common');
  const user = useOutletContext<CurrentUser>();
  const ensureTaxonomiesLoaded = useTaxonomyStore(
    (store) => store.ensureLoaded
  );

  // Warm the taxonomy lists once the authenticated shell mounts, so the
  // Categories page opens straight into real rows instead of skeletons.
  useEffect(() => {
    ensureTaxonomiesLoaded();
  }, [ensureTaxonomiesLoaded]);

  return (
    <TooltipProvider delay={0}>
      {/* A tablet starts on the icon rail, so the jobs table keeps its status column */}
      <SidebarProvider
        defaultOpen={!window.matchMedia('(max-width: 1023px)').matches}
      >
        {/* First in the tab order, so it skips the sidebar rather than following it */}
        <a
          href="#app-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-30 focus:rounded-md focus:bg-background focus:px-2 focus:py-1 focus:text-xs focus:ring-2 focus:ring-ring"
        >
          {t('layout.skipToContent')}
        </a>
        <AppSidebar />
        <SidebarInset className="h-svh min-w-0 overflow-hidden">
          <AppHeaderActionProvider>
            <AppFooterActionProvider>
              {/* Opens the nav sheet on mobile, where the sidebar is hidden. */}
              <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4 md:hidden">
                <SidebarTrigger aria-label={t('layout.openMenu')} />
                <span className="font-serif text-lg font-medium tracking-tight text-foreground [text-box:cap_alphabetic]">
                  {t('brand.name')}
                </span>
              </header>
              <ViewAsBanner />
              {/* The launcher shares the content's cell, so it clears the form footer, yet comes after it in tab order */}
              <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto]">
                {/* Focusable so the skip link moves focus here, not only the scroll */}
                <div
                  id="app-content"
                  tabIndex={-1}
                  className="col-start-1 row-start-1 flex min-h-0 flex-col overflow-y-auto outline-none"
                >
                  <Outlet />
                </div>
                <AppFooterActionPanel />
                <FeedbackLauncher
                  email={user.email}
                  className="z-10 col-start-1 row-start-1 m-4 self-end justify-self-end sm:m-6"
                />
              </div>
            </AppFooterActionProvider>
          </AppHeaderActionProvider>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
