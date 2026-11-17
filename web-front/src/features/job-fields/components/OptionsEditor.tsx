import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** Edits the choice list of a select/multiselect field as removable chips. */
export function OptionsEditor({
  inputId,
  options,
  onChange
}: {
  inputId: string;
  options: string[];
  onChange: (next: string[]) => void;
}) {
  const { t } = useTranslation('jobFields');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addOption = () => {
    const value = draft.trim();
    if (!value) {
      return;
    }
    if (
      options.some((option) => option.toLowerCase() === value.toLowerCase())
    ) {
      setError(t('validation.duplicateOption'));
      return;
    }
    onChange([...options, value]);
    setDraft('');
    setError(null);
  };

  const removeOption = (value: string) => {
    onChange(options.filter((option) => option !== value));
  };

  return (
    <div className="flex flex-col gap-2">
      {options.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {options.map((option) => (
            <span
              key={option}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-foreground"
            >
              {option}
              <button
                type="button"
                onClick={() => removeOption(option)}
                aria-label={`${t('form.delete')} ${option}`}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <Input
            id={inputId}
            value={draft}
            placeholder={t('form.optionPlaceholder')}
            onChange={(event) => {
              setDraft(event.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addOption();
              }
            }}
          />
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={addOption}
          disabled={draft.trim().length === 0}
          className="gap-1.5"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          {t('form.optionAdd')}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t('form.optionsHint')}</p>
    </div>
  );
}
