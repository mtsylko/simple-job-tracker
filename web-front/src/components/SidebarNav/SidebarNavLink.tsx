import type { LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

export type SidebarNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  matches: (pathname: string) => boolean;
};

export function SidebarNavLink({ item }: { item: SidebarNavItem }) {
  const { pathname } = useLocation();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link to={item.href} />}
        isActive={item.matches(pathname)}
        tooltip={item.title}
        className="font-medium text-sidebar-foreground"
      >
        <item.icon />
        <span className="flex-1 truncate">{item.title}</span>
        {item.badge !== undefined ? (
          <span className="num text-2xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            {item.badge}
          </span>
        ) : null}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
