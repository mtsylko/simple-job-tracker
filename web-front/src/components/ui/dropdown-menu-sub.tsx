import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

// Submenu parts the vendored dropdown-menu lacks; the submenu's popup is DropdownMenuContent.
const DropdownMenuSub = MenuPrimitive.SubmenuRoot;

function DropdownMenuSubTrigger({
  className,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      className={cn(
        'flex min-h-7 cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-popup-open:bg-accent data-popup-open:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50',
        className
      )}
      {...props}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">{children}</span>
      <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
    </MenuPrimitive.SubmenuTrigger>
  );
}

export { DropdownMenuSub, DropdownMenuSubTrigger };
