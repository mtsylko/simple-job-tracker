import type { Ref } from 'react';
import { useTranslation } from 'react-i18next';

import type { Language } from '@/app/language';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { compareTokens } from '@/features/admin-translations/translation-catalog';

/** One language's text in the edit dialog, with the shipped copy beside it once it differs. */
export function TranslationValueField({
  id,
  language,
  shipped,
  value,
  textareaRef,
  onChange
}: {
  id: string;
  language: Language;
  shipped: string;
  value: string;
  textareaRef?: Ref<HTMLTextAreaElement>;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation('adminTranslations');
  const { t: tc } = useTranslation('common');
  const changed = value !== shipped;
  const empty = value.trim().length === 0;
  const tokens = compareTokens(shipped, value);
  const hintId = `${id}-hint`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-6 items-center justify-between gap-2">
        <Label htmlFor={id}>{tc(`language.${language}`)}</Label>
        {changed && (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="px-0"
            onClick={() => {
              onChange(shipped);
              // The button goes away once the text matches, so focus moves on to the field.
              document.getElementById(id)?.focus();
            }}
          >
            {t('edit.reset')}
          </Button>
        )}
      </div>
      <Textarea
        ref={textareaRef}
        id={id}
        value={value}
        rows={2}
        aria-invalid={empty || undefined}
        aria-describedby={hintId}
        className="max-h-48 resize-y"
        onChange={(event) => onChange(event.currentTarget.value)}
      />
      <div id={hintId} className="flex flex-col gap-1 text-xs">
        {empty && <p className="text-destructive">{t('edit.empty')}</p>}
        {!empty && tokens.missing.length > 0 && (
          <p className="text-clay-ink">
            {t('edit.missingTokens', { tokens: tokens.missing.join(' ') })}
          </p>
        )}
        {!empty && tokens.unknown.length > 0 && (
          <p className="text-clay-ink">
            {t('edit.unknownTokens', { tokens: tokens.unknown.join(' ') })}
          </p>
        )}
        {changed && (
          <p className="break-words text-muted-foreground">
            <span className="font-medium">{t('edit.shipped')}:</span> {shipped}
          </p>
        )}
      </div>
    </div>
  );
}
