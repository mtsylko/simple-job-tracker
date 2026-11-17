import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useCvVersionsLoadState } from '@/features/cv-versions/use-cv-versions-load-state';
import { useJobsLoadState } from '@/features/jobs/use-jobs-load-state';
import { AnalyticsPage } from '@/features/analytics/pages/analytics-page';

export function AnalyticsRoute() {
  const { t } = useTranslation('analytics');
  const { jobs, isLoading, error, refreshJobs } = useJobsLoadState();
  const { cvVersions } = useCvVersionsLoadState();

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-4xl py-8 md:py-10">
        <section className="rounded-lg border bg-card p-4">
          <h1 className="m-0 text-2xl font-medium text-foreground">
            {t('route.loadingTitle')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('route.loadingSubtitle')}
          </p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-4xl py-8 md:py-10">
        <section className="rounded-lg border bg-card p-4">
          <h1 className="m-0 text-2xl font-medium text-foreground">
            {t('route.errorTitle')}
          </h1>
          <p className="mt-2 text-sm text-destructive">{error}</p>
          <div className="mt-4">
            <Button variant="outline" onClick={() => void refreshJobs()}>
              {t('route.retry')}
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return <AnalyticsPage jobs={jobs} cvVersions={cvVersions} />;
}
