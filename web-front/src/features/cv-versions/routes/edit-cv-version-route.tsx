import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@/app/routes';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { CvVersionFormPage } from '@/features/cv-versions/pages/cv-version-form-page';
import { useCvVersionsStore } from '@/features/cv-versions/cv-version-store';
import type { CvVersionFormValues } from '@/features/cv-versions/types';
import { useCvVersionsLoadState } from '@/features/cv-versions/use-cv-versions-load-state';
import { notifyActionSuccess } from '@/lib/notifications';

export function EditCvVersionRoute() {
  const navigate = useNavigate();
  const { t } = useTranslation('cvVersions');
  const { cvVersions, isLoading, error, refreshCvVersions } =
    useCvVersionsLoadState();
  const updateCvVersion = useCvVersionsStore((state) => state.updateCvVersion);
  const { id: cvVersionId = '' } = useParams();
  const cvVersion = cvVersions.find((item) => item.id === cvVersionId);

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

  if (error && !cvVersion) {
    return (
      <main className="mx-auto w-full max-w-6xl py-8 md:py-10">
        <section className="w-full max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t('route.loadErrorTitle')}
              </CardTitle>
              <CardDescription className="text-destructive">
                {error}
              </CardDescription>
              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => void refreshCvVersions()}
                >
                  {t('route.retry')}
                </Button>
              </div>
            </CardHeader>
          </Card>
        </section>
      </main>
    );
  }

  if (!cvVersion) {
    return (
      <main className="mx-auto w-full max-w-6xl py-8 md:py-10">
        <section className="w-full max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t('route.notFoundTitle')}
              </CardTitle>
              <CardDescription>{t('route.notFoundBody')}</CardDescription>
              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(ROUTES.cvVersions)}
                >
                  {t('form.backToCvVersions')}
                </Button>
              </div>
            </CardHeader>
          </Card>
        </section>
      </main>
    );
  }

  async function handleSubmit(values: CvVersionFormValues) {
    await updateCvVersion(cvVersionId, values);
  }

  function handleSaved() {
    notifyActionSuccess('updated', 'cvVersion');
    navigate(ROUTES.cvVersions);
  }

  function handleCancel() {
    navigate(ROUTES.cvVersions);
  }

  return (
    <CvVersionFormPage
      key={`cv-version-edit-${cvVersionId}-${cvVersion?.id ?? 'unloaded'}`}
      mode="edit"
      cvVersion={cvVersion}
      onSubmit={handleSubmit}
      onSaved={handleSaved}
      onCancel={handleCancel}
    />
  );
}
