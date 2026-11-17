import { useRef, useState } from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import { STATUS_COLOR_PRESETS } from '@job-tracker/shared';
import { useTranslation } from 'react-i18next';

import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { statusBadgeStyle } from '@/features/jobs/status-badge-colors';
import { handleRadioGroupKeyDown, radioTabIndex } from '@/lib/radio-group-keys';

const PRESET_NAME_KEYS: Record<(typeof STATUS_COLOR_PRESETS)[number], string> =
  {
    '#4a6088': 'slate',
    '#2a6fb5': 'blue',
    '#1f7c88': 'teal',
    '#2c8552': 'green',
    '#a8801f': 'amber',
    '#6259a8': 'violet',
    '#b23a48': 'red',
    '#6b6b6b': 'grey'
  };

function Swatch({ color }: { color: string }) {
  const { badge } = statusBadgeStyle(color);
  return (
    <span
      className="size-6 rounded-full border"
      style={{
        backgroundColor: badge.backgroundColor,
        borderColor: badge.borderColor
      }}
    />
  );
}

export function ColorSwatchPicker({
  color,
  onChange,
  disabled
}: {
  color: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation('taxonomies');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(color);
  // Mirrors `draft` so the commit-on-close reads the latest value even when the
  // close fires in the same tick as the last change. Only ever touched in event
  // handlers, never during render.
  const draftRef = useRef(color);

  const updateDraft = (next: string) => {
    draftRef.current = next;
    setDraft(next);
  };

  // The colour wheel fires continuously; persisting per-frame would hammer the
  // API, so the draft is previewed live and committed once, when the popover
  // closes with a changed value. Opening resets the draft to the committed
  // colour (covers an outside change while the popover was shut).
  const handleOpenChange = (next: boolean) => {
    if (next) {
      updateDraft(color);
    } else if (draftRef.current !== color) {
      onChange(draftRef.current);
    }
    setOpen(next);
  };

  const checkedPreset = STATUS_COLOR_PRESETS.find(
    (preset) => preset.toLowerCase() === draft.toLowerCase()
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        type="button"
        disabled={disabled}
        aria-label={t('sections.status.colorLabel')}
        className="inline-flex cursor-pointer items-center rounded-full transition-shadow hover:ring-2 hover:ring-warm-line-2 hover:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Swatch color={open ? draft : color} />
      </PopoverTrigger>
      <PopoverContent className="flex w-auto flex-col gap-3 p-3">
        <HexColorPicker color={draft} onChange={updateDraft} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">#</span>
          <HexColorInput
            color={draft}
            onChange={updateDraft}
            prefixed={false}
            className="h-8 w-24 rounded-md border border-input bg-transparent px-2 font-mono text-sm uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div
          role="radiogroup"
          aria-label={t('colors.presets')}
          className="grid grid-cols-8 gap-1.5"
        >
          {STATUS_COLOR_PRESETS.map((preset, index) => {
            const isChecked = preset === checkedPreset;
            return (
              <button
                key={preset}
                type="button"
                role="radio"
                aria-checked={isChecked}
                aria-label={t(`colors.${PRESET_NAME_KEYS[preset]}`)}
                tabIndex={radioTabIndex(isChecked, index, !!checkedPreset)}
                onClick={() => {
                  updateDraft(preset);
                  handleOpenChange(false);
                }}
                // Arrows preview a colour; a click, Enter or Space picks it and closes.
                onKeyDown={(event) =>
                  handleRadioGroupKeyDown(event, (next) =>
                    updateDraft(STATUS_COLOR_PRESETS[next])
                  )
                }
                className={`size-5 rounded-full border transition-transform hover:scale-110 ${
                  isChecked
                    ? 'ring-2 ring-clay ring-offset-1'
                    : 'border-warm-line-2'
                }`}
                style={{ backgroundColor: preset }}
              />
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
