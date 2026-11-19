import { ChevronsUpDown, Cookie, LogOut, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { clearTaxonomyCache } from '@/features/taxonomies/taxonomy-store';
import { useAnalyticsConsentStore } from '@/lib/analytics-consent-store';
import { isAnalyticsEnabled } from '@/lib/google-analytics';

import { ROUTES } from '@/app/routes';
import { LanguageSubmenu } from '@/app/LanguageSubmenu';
import { ThemeMenuItems } from '@/app/ThemeMenuItems';

function userInitials(displayName: string | null, email: string): string {
  if (displayName) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2)
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }
  return email[0].toUpperCase();
}

/**
 * The whole footer row is the menu trigger, rather than a text block with icon
 * buttons beside it: two competing buttons truncated the email, and anything
 * placed outside the trigger disappears when the sidebar collapses to icons.
 */
export function SidebarUserMenu() {
  const { user } = useCurrentUser();
  const { t } = useTranslation('common');
  const reviewCookieConsent = useAnalyticsConsentStore((state) => state.review);

  const label = user?.displayName ?? user?.email ?? '';
  const avatarUrl = user?.avatarUrl ?? null;
  const showAvatar = avatarUrl !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('sidebar.userMenu')}
        className="h-auto w-full justify-start gap-2.5 rounded-md border-transparent bg-transparent px-2 py-2 text-left hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
      >
        {showAvatar ? (
          <img
            src={avatarUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="size-7 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="grid size-7 shrink-0 place-items-center rounded-full bg-accent font-serif text-sm font-medium text-accent-foreground">
            {user ? userInitials(user.displayName, user.email) : '…'}
          </div>
        )}
        <div className="min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
          <div className="truncate text-sm font-medium text-foreground">
            {label}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {user?.email ?? ''}
          </div>
        </div>
        <ChevronsUpDown
          className="size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="start"
        alignOffset={32}
        sideOffset={8}
        className="w-56"
      >
        {/* `text-popover-foreground` overrides the base-layer anchor colour, so
            the link row reads the same as the plain menu rows beside it. */}
        <DropdownMenuItem
          render={<Link to={ROUTES.profile} />}
          className="text-popover-foreground"
        >
          <span className="flex items-center gap-2">
            <UserRound className="size-4" aria-hidden="true" />
            {t('sidebar.profile')}
          </span>
        </DropdownMenuItem>
        <LanguageSubmenu />
        {isAnalyticsEnabled && (
          <DropdownMenuItem onClick={reviewCookieConsent}>
            <span className="flex items-center gap-2">
              <Cookie className="size-4" aria-hidden="true" />
              {t('cookieConsent.settings')}
            </span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <ThemeMenuItems />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            clearTaxonomyCache();
            window.location.href = '/auth/logout';
          }}
        >
          <span className="flex items-center gap-2">
            <LogOut className="size-4" aria-hidden="true" />
            {t('sidebar.logOut')}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
