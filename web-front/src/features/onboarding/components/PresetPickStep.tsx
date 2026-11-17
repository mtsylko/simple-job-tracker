import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  GENERIC_PRESET_KEY,
  JOB_PRESETS,
  type JobPreset
} from '@job-tracker/shared';

import { cn } from '@/lib/utils';

/** Step one: one card per profession preset, and "Other" as a row of its own. */
export function PresetPickStep({
  pickedKey,
  onPick
}: {
  pickedKey: string | null;
  onPick: (key: string) => void;
}) {
  const { t } = useTranslation('taxonomies');

  // What the next step offers, so the card shows the field's own trades.
  const contents = (preset: JobPreset) => {
    const prefix = `presets.options.${preset.key}`;
    if (preset.directions?.length) {
      return preset.directions
        .map((key) => t(`${prefix}.directions.${key}`))
        .join(', ');
    }
    if (preset.specializations.length > 0) {
      return preset.specializations
        .map((spec) => t(`${prefix}.specializations.${spec.key}`))
        .join(', ');
    }
    return t(`${prefix}.description`);
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {JOB_PRESETS.map((preset) => {
        const isPicked = preset.key === pickedKey;
        return (
          <button
            key={preset.key}
            type="button"
            aria-pressed={isPicked}
            onClick={() => onPick(preset.key)}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-primary',
              preset.key === GENERIC_PRESET_KEY && 'col-span-full',
              isPicked
                ? 'border-primary bg-accent ring-1 ring-primary'
                : 'border-border bg-card hover:bg-muted'
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">
                {t(`presets.options.${preset.key}.label`)}
              </span>
              <span className="mt-1 block text-sm text-ink-2">
                {contents(preset)}
              </span>
            </span>
            {/* Always laid out, so picking a card never rewraps its text. */}
            <Check
              className={cn(
                'size-4 shrink-0 text-primary',
                !isPicked && 'invisible'
              )}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}
