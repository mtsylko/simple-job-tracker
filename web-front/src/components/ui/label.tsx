import * as React from 'react';

import { cn } from '@/lib/utils';

function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      data-slot="label"
      className={cn(
        'flex items-center gap-2 text-xs leading-none font-medium select-text group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

function LabelHint({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="label-hint"
      className={cn(
        'ml-auto text-xs/relaxed font-normal text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}

export { Label, LabelHint };
