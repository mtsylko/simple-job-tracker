import { Plus, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

export interface EmptyStateFeature {
  key: string;
  title: string;
  description: string;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  ctaLabel: string;
  features: EmptyStateFeature[];
  onAdd: () => void;
}

/**
 * Shared list-page empty state. Owns its own outer spacing so every list page
 * places it identically below the tabs.
 */
export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  ctaLabel,
  features,
  onAdd
}: EmptyStateProps) {
  return (
    <div className="mx-7 mt-5 mb-7 flex flex-col items-center rounded-2xl border border-dashed border-warm-line-2 bg-card px-7 py-16 text-center">
      <div className="mb-5 grid size-23 place-items-center rounded-full bg-clay-soft text-clay-ink">
        <Icon className="size-9" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <h2 className="font-serif text-display font-light tracking-tight">
        {title}
      </h2>
      <div className="mt-2 mb-6 max-w-100">
        <p className="text-sm leading-normal text-muted-foreground">
          {subtitle}
        </p>
      </div>
      <Button size="lg" onClick={onAdd}>
        <Plus className="size-4" aria-hidden="true" />
        {ctaLabel}
      </Button>

      <div className="mt-10 grid max-w-180 grid-cols-1 gap-4 text-left sm:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.key}
            className="rounded-xl border border-border bg-background p-4"
          >
            <div className="mb-1 font-serif text-base font-medium">
              {feature.title}
            </div>
            <div className="text-xs leading-normal text-muted-foreground">
              {feature.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
