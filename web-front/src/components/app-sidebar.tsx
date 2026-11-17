import {
  BarChart2,
  Briefcase,
  Building2,
  FileText,
  Languages,
  MessageSquareText,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ROUTES, taxonomiesListPath } from '@/app/routes';
import { getStoredListSearch } from '@/features/jobs/pages/job-list-page/use-job-list-url-filters';
import { SidebarUserMenu } from '@/components/SidebarUserMenu';
import {
  SidebarNavGroup,
  type SidebarNavGroupItem
} from '@/components/SidebarNav/SidebarNavGroup';
import {
  SidebarNavLink,
  type SidebarNavItem
} from '@/components/SidebarNav/SidebarNavLink';
import { useCurrentUser } from '@/features/auth/use-current-user';
import {
  CATEGORY_ICON_BY_SLUG,
  CATEGORY_KIND_BY_SLUG,
  CATEGORY_SLUGS
} from '@/features/taxonomies/categories';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarTrigger
} from '@/components/ui/sidebar';

export function AppSidebar() {
  const { t } = useTranslation('common');
  const { t: tTaxonomies } = useTranslation('taxonomies');
  const { user } = useCurrentUser();

  const workspaceItems: (SidebarNavItem | SidebarNavGroupItem)[] = [
    {
      // Carry the filters/tab/sort the user left the list in, so returning from
      // another section keeps the same view rather than resetting to defaults.
      title: t('sidebar.nav.applications'),
      href: ROUTES.applications + getStoredListSearch(),
      icon: Briefcase,
      matches: (pathname) =>
        pathname === ROUTES.applications ||
        pathname === ROUTES.jobs ||
        pathname.startsWith('/jobs/')
    },
    {
      title: t('sidebar.nav.cvVersions'),
      href: ROUTES.cvVersions,
      icon: FileText,
      matches: (pathname) =>
        pathname === ROUTES.cvVersions || pathname.startsWith('/cv-versions/')
    },
    {
      title: t('sidebar.nav.companies'),
      href: ROUTES.companies,
      icon: Building2,
      matches: (pathname) => pathname === ROUTES.companies
    },
    {
      title: t('sidebar.nav.analytics'),
      href: ROUTES.analytics,
      icon: BarChart2,
      matches: (pathname) => pathname === ROUTES.analytics
    },
    {
      // One view per list, named as the application form names the field.
      title: t('sidebar.nav.taxonomies'),
      icon: Tags,
      items: CATEGORY_SLUGS.map((slug) => {
        const href = taxonomiesListPath(slug);
        return {
          title: tTaxonomies(`sections.${CATEGORY_KIND_BY_SLUG[slug]}.title`),
          href,
          icon: CATEGORY_ICON_BY_SLUG[slug],
          matches: (pathname: string) => pathname === href
        };
      })
    },
    {
      title: t('sidebar.nav.jobFields'),
      href: ROUTES.jobFields,
      icon: SlidersHorizontal,
      matches: (pathname) => pathname === ROUTES.jobFields
    },
    // A viewed account is shown as its owner sees it, but the way back to the admin pages stays.
    ...(user?.role === 'admin'
      ? [
          {
            title: t('sidebar.nav.admin'),
            icon: ShieldCheck,
            items: [
              {
                title: t('sidebar.nav.adminUsers'),
                href: ROUTES.adminUsers,
                icon: Users,
                matches: (pathname: string) => pathname === ROUTES.adminUsers
              },
              {
                title: t('sidebar.nav.adminFeedback'),
                href: ROUTES.adminFeedback,
                icon: MessageSquareText,
                matches: (pathname: string) => pathname === ROUTES.adminFeedback
              },
              {
                title: t('sidebar.nav.adminTranslations'),
                href: ROUTES.adminTranslations,
                icon: Languages,
                matches: (pathname: string) =>
                  pathname === ROUTES.adminTranslations
              }
            ]
          }
        ]
      : [])
  ];

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      mobileTitle={t('sidebar.primaryNavigation')}
      mobileDescription={t('sidebar.mobileDescription')}
    >
      <SidebarHeader className="h-16 flex-row items-center justify-between gap-1 bg-sidebar px-2 py-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <Link
          to={ROUTES.applications}
          className="flex h-full min-w-0 flex-1 items-center gap-2.5 text-sidebar-foreground outline-none group-data-[collapsible=icon]:hidden"
          aria-label={t('sidebar.goToApplications')}
        >
          <img
            src="/icon.svg"
            alt={t('brand.name')}
            className="size-8 shrink-0 rounded-md"
          />
          <div className="min-w-0 truncate font-serif text-lg font-medium tracking-tight text-foreground [text-box:cap_alphabetic]">
            {t('brand.name')}
          </div>
        </Link>
        {/* Collapses the rail on desktop, closes the sheet on mobile. */}
        <SidebarTrigger
          aria-label={t('sidebar.toggle')}
          className="size-8 shrink-0 text-sidebar-foreground/70 hover:text-sidebar-foreground [&_svg]:!size-4"
        />
      </SidebarHeader>

      <SidebarContent className="pt-5">
        {/* Workspace */}
        <SidebarGroup>
          <SidebarGroupContent>
            <nav aria-label={t('sidebar.primaryNavigation')}>
              <SidebarMenu>
                {workspaceItems.map((item) =>
                  'items' in item ? (
                    <SidebarNavGroup key={item.title} group={item} />
                  ) : (
                    <SidebarNavLink key={item.title} item={item} />
                  )
                )}
              </SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User footer */}
      <SidebarFooter className="border-t border-sidebar-border bg-sidebar">
        <SidebarUserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
