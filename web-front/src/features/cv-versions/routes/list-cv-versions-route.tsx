import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { CvVersionsListPage } from '@/features/cv-versions/pages/cv-versions-list-page';
import { useCvVersionsStore } from '@/features/cv-versions/cv-version-store';
import { useCvVersionsLoadState } from '@/features/cv-versions/use-cv-versions-load-state';

export function ListCvVersionsRoute() {
  const { t } = useTranslation('cvVersions');
  const { cvVersions, isLoading, error, refreshCvVersions } =
    useCvVersionsLoadState();
  const deleteCvVersion = useCvVersionsStore((state) => state.deleteCvVersion);
  const toggleCvVersionEnabled = useCvVersionsStore(
    (state) => state.toggleCvVersionEnabled
  );

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-4xl py-8 md:py-10">
        <section className="rounded-lg border bg-card p-4">
          <h1 className="m-0 text-2xl font-medium text-foreground">
            {t('route.loadingListTitle')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('route.loadingListSubtitle')}
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
            {t('route.loadListErrorTitle')}
          </h1>
          <p className="mt-2 text-sm text-destructive">{error}</p>
          <div className="mt-4">
            <Button variant="outline" onClick={() => void refreshCvVersions()}>
              {t('route.retry')}
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <CvVersionsListPage
      cvVersions={cvVersions}
      onDelete={deleteCvVersion}
      onToggleEnabled={toggleCvVersionEnabled}
    />
  );
}
