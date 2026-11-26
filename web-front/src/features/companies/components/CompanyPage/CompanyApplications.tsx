import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { CompanyApplication } from '@job-tracker/shared';

import { jobEditPath } from '@/app/routes';
import { companyApplicationsPath } from '@/features/companies/company-paths';
import { StatusBadge } from '@/features/jobs/pages/job-list-page/TableCells/StatusBadge';
import { formatDisplayDate } from '@/lib/format-date';

/** The company's applications, each opening its own page; the full list is one link away. */
export function CompanyApplications({
  company,
  applications
}: {
  company: string;
  applications: CompanyApplication[];
}) {
  const { t } = useTranslation('companies');

  return (
    <section aria-labelledby="company-applications-title">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="company-applications-title"
          className="m-0 font-sans text-sm font-medium text-foreground"
        >
          {t('details.sections.applications')}{' '}
          <span className="num font-normal text-muted-foreground">
            {applications.length}
          </span>
        </h2>
        {applications.length > 0 && (
          <Link
            to={companyApplicationsPath(company)}
            className="inline-flex items-center gap-1 text-sm text-ink-2 hover:text-foreground"
          >
            {t('details.showInApplications')}
            <ExternalLink className="size-3" aria-hidden="true" />
          </Link>
        )}
      </div>

      {applications.length === 0 ? (
        <p className="m-0 py-2.5 text-sm text-muted-foreground">
          {t('details.noApplications')}
        </p>
      ) : (
        <ul className="m-0 list-none p-0">
          {applications.map((application) => (
            <li
              key={application.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-t border-warm-line py-2.5 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_9rem_7rem]"
            >
              <span className="min-w-0 truncate text-sm">
                <Link
                  to={jobEditPath(application.id)}
                  className="font-medium text-foreground hover:underline"
                >
                  {application.role ?? '—'}
                </Link>
                {application.level && (
                  <span className="text-muted-foreground">
                    {' '}
                    · {application.level}
                  </span>
                )}
                {application.archived && (
                  <span className="text-muted-foreground">
                    {' '}
                    · {t('jobs:list.table.archivedMarker')}
                  </span>
                )}
              </span>
              <span className="hidden sm:block">
                {application.status && (
                  <StatusBadge
                    status={application.status.value}
                    color={application.status.color}
                  />
                )}
              </span>
              <span className="num text-sm text-ink-2">
                {formatDisplayDate(application.appliedAt.slice(0, 10))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
