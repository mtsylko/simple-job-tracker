import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function JobPostLinkCell({ href }: { href: string }) {
  const { t } = useTranslation('jobs');
  if (!href) return <span className="text-muted-foreground">—</span>;
  return (
    // Quiet until hovered: a column of accent links on every row outshouted the data.
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-ink-2 no-underline transition-colors hover:text-clay"
      onClick={(e) => e.stopPropagation()}
    >
      {t('list.table.open')}
      <ExternalLink className="size-3" aria-hidden="true" />
    </a>
  );
}
