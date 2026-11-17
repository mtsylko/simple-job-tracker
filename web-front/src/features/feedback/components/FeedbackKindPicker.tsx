import { useTranslation } from 'react-i18next';
import { FEEDBACK_KINDS, type FeedbackKind } from '@job-tracker/shared';

import { FEEDBACK_KIND_ICONS } from '@/features/feedback/feedback-kind-icons';
import { cn } from '@/lib/utils';
import { handleRadioGroupKeyDown, radioTabIndex } from '@/lib/radio-group-keys';

export function FeedbackKindPicker({
  labelId,
  value,
  disabled,
  onChange
}: {
  labelId: string;
  value: FeedbackKind;
  disabled: boolean;
  onChange: (kind: FeedbackKind) => void;
}) {
  const { t } = useTranslation('feedback');

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      className="flex flex-wrap gap-2"
    >
      {FEEDBACK_KINDS.map((kind, index) => {
        const Icon = FEEDBACK_KIND_ICONS[kind];
        const isChecked = value === kind;
        return (
          <button
            key={kind}
            type="button"
            role="radio"
            aria-checked={isChecked}
            tabIndex={radioTabIndex(isChecked, index, true)}
            disabled={disabled}
            onClick={() => onChange(kind)}
            onKeyDown={(event) =>
              handleRadioGroupKeyDown(event, (next) =>
                onChange(FEEDBACK_KINDS[next])
              )
            }
            className={cn(
              'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50',
              isChecked
                ? 'border-clay bg-clay-soft text-clay-ink'
                : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {t(`kinds.${kind}`)}
          </button>
        );
      })}
    </div>
  );
}
