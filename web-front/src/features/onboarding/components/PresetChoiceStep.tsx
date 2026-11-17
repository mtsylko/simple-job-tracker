import { useId } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export type PresetChoice = {
  key: string;
  label: string;
};

export type PresetChoiceGroup = {
  key: string;
  /** Left out when the step shows a single group. */
  title?: string;
  /** Shown ticked and fixed: what comes in without a choice. */
  locked?: boolean;
  choices: PresetChoice[];
};

/** A directions or specializations step: a grid of checkbox tiles, any number ticked. */
export function PresetChoiceStep({
  groups,
  picked,
  onToggle
}: {
  groups: PresetChoiceGroup[];
  picked: ReadonlySet<string>;
  onToggle: (key: string) => void;
}) {
  const baseId = useId();

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => {
        const titleId = `${baseId}-${group.key}`;
        return (
          <div
            key={group.key}
            role={group.title ? 'group' : undefined}
            aria-labelledby={group.title ? titleId : undefined}
            className="flex flex-col gap-3"
          >
            {group.title && (
              <h2
                id={titleId}
                className="m-0 font-sans text-sm font-semibold tracking-normal text-ink-2"
              >
                {group.title}
              </h2>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.choices.map((choice) => {
                const isPicked = group.locked || picked.has(choice.key);
                return (
                  <label
                    key={choice.key}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors',
                      group.locked
                        ? 'border-border bg-muted'
                        : isPicked
                          ? 'cursor-pointer border-primary bg-accent ring-1 ring-primary'
                          : 'cursor-pointer border-border bg-card hover:bg-muted'
                    )}
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={isPicked}
                      disabled={group.locked}
                      onCheckedChange={() => onToggle(choice.key)}
                    />
                    <span className="min-w-0 flex-1 text-sm font-semibold text-foreground">
                      {choice.label}
                    </span>
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
