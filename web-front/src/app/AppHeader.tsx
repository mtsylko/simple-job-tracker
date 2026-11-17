import { Fragment } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut } from 'lucide-react';

import { SidebarTrigger } from '@/components/ui/sidebar';

import { useRouteMeta } from './route-meta';

export function AppHeader() {
  const location = useLocation();
  const { t } = useTranslation('common');
  const { crumbs } = useRouteMeta(location.pathname);

  return (
    <header className="sticky top-0 z-20 flex h-[57px] shrink-0 items-center justify-between gap-5 border-b border-border bg-background px-7">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <SidebarTrigger
          aria-label={t('layout.openMenu')}
          className="mr-1 shrink-0 md:hidden"
        />
        {crumbs.map((crumb, i) => (
          <Fragment key={i}>
            <span className={i === crumbs.length - 1 ? 'text-foreground' : ''}>
              {crumb}
            </span>
            {i < crumbs.length - 1 && <span className="opacity-40">/</span>}
          </Fragment>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={t('header.logOut')}
          onClick={() => {
            window.location.href = '/auth/logout';
          }}
          className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-[15px]" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
