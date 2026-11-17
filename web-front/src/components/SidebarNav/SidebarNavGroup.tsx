import { useState } from 'react';
import { Menu } from '@base-ui/react/menu';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

import type { SidebarNavItem } from './SidebarNavLink';

export type SidebarNavGroupItem = {
  title: string;
  icon: LucideIcon;
  items: SidebarNavItem[];
};

export function SidebarNavGroup({ group }: { group: SidebarNavGroupItem }) {
  const { pathname } = useLocation();
  const active = group.items.some((item) => item.matches(pathname));
  const [open, setOpen] = useState(active);
  const [wasActive, setWasActive] = useState(active);
  const [flyoutOpen, setFlyoutOpen] = useState(false);

  // Landing on one of the group's pages from elsewhere opens it again.
  if (active !== wasActive) {
    setWasActive(active);
    if (active) setOpen(true);
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        isActive={active && !open}
        className="font-medium text-sidebar-foreground group-data-[collapsible=icon]:hidden"
      >
        <group.icon />
        <span className="flex-1 truncate">{group.title}</span>
        <ChevronRight
          className={cn(
            'text-muted-foreground transition-transform',
            open && 'rotate-90'
          )}
          aria-hidden="true"
        />
      </SidebarMenuButton>
      {open ? (
        <SidebarMenuSub>
          {group.items.map((item) => (
            <SidebarMenuSubItem key={item.href}>
              <SidebarMenuSubButton
                render={<Link to={item.href} />}
                isActive={item.matches(pathname)}
                className="font-medium data-[size=md]:text-sm [&>svg]:text-current"
              >
                <item.icon aria-hidden="true" />
                <span>{item.title}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      ) : null}

      {/* The icon rail hides sub-lists, so there the group opens as a flyout. */}
      <DropdownMenu open={flyoutOpen} onOpenChange={setFlyoutOpen}>
        <Menu.Trigger
          render={
            <SidebarMenuButton
              isActive={active}
              // The tooltip would cover the flyout's own heading.
              tooltip={{ children: group.title, hidden: flyoutOpen }}
              className="hidden font-medium text-sidebar-foreground group-data-[collapsible=icon]:flex"
            />
          }
        >
          <group.icon />
          <span className="flex-1 truncate">{group.title}</span>
        </Menu.Trigger>
        <DropdownMenuContent
          side="right"
          align="start"
          sideOffset={8}
          className="w-44"
        >
          <DropdownMenuLabel className="text-muted-foreground">
            {group.title}
          </DropdownMenuLabel>
          {group.items.map((item) => (
            <DropdownMenuItem
              key={item.href}
              render={<Link to={item.href} />}
              className="gap-2 text-popover-foreground"
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.title}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
