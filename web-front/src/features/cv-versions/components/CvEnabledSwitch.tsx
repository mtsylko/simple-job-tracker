import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

/** The On/Off switch of one CV version, in the table row and on the phone card alike. */
export function CvEnabledSwitch({
  on,
  label,
  disabled,
  onChange
}: {
  on: boolean;
  /** The accessible name, since the switch shows no text of its own. */
  label: string;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  const { t } = useTranslation('cvVersions');

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      title={on ? t('list.toggle.onHint') : t('list.toggle.offHint')}
      onClick={() => onChange(!on)}
      className={cn(
        'inline-flex h-4.5 w-7.5 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50',
        on ? 'bg-clay' : 'bg-warm-line-2'
      )}
    >
      <span
        className={cn(
          'size-3.5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.2)] transition-transform duration-150',
          on ? 'translate-x-3' : 'translate-x-0'
        )}
      />
    </button>
  );
}
