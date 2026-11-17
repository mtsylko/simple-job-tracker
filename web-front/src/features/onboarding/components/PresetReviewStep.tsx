import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export type PresetValueGroup = {
  key: string;
  title: string;
  values: string[];
};

/** The last step: every value the preset would add, ticked until the user unticks it. */
export function PresetReviewStep({
  groups,
  isExcluded,
  onToggle,
  onToggleGroup
}: {
  groups: PresetValueGroup[];
  isExcluded: (groupKey: string, value: string) => boolean;
  onToggle: (groupKey: string, value: string) => void;
  onToggleGroup: (group: PresetValueGroup, include: boolean) => void;
}) {
  const { t } = useTranslation('taxonomies');
  const baseId = useId();

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => {
        const keptCount = group.values.filter(
          (value) => !isExcluded(group.key, value)
        ).length;
        const allKept = keptCount === group.values.length;
        const titleId = `${baseId}-${group.key}`;
        return (
          <div
            key={group.key}
            role="group"
            aria-labelledby={titleId}
            className="flex flex-col gap-3"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2
                id={titleId}
                className="m-0 font-sans text-sm font-semibold tracking-normal text-foreground"
              >
                {group.title}{' '}
                <span className="font-normal text-ink-3">
                  {t('presets.selectedOf', {
                    selected: keptCount,
                    total: group.values.length
                  })}
                </span>
              </h2>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto px-0"
                onClick={() => onToggleGroup(group, !allKept)}
              >
                {allKept ? t('presets.clearAll') : t('presets.selectAll')}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.values.map((value) => {
                const kept = !isExcluded(group.key, value);
                return (
                  <label
                    key={value}
                    className={cn(
                      'inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors',
                      kept
                        ? 'border-warm-line-2 bg-card text-foreground'
                        : 'border-border bg-card text-ink-3 line-through'
                    )}
                  >
                    <Checkbox
                      checked={kept}
                      onCheckedChange={() => onToggle(group.key, value)}
                    />
                    {value}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
