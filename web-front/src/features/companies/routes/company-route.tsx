import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { CompanyDetails } from '@job-tracker/shared';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  getCompanyDetails,
  updateCompany
} from '@/features/companies/companies-api';
import { useBlacklistStore } from '@/features/companies/blacklist-store';
import { companiesBackPath } from '@/features/companies/company-paths';
import {
  toCompanyFormValues,
  toUpdateCompanyInput
} from '@/features/companies/components/CompanyPage/company-form';
import { CompanyPage } from '@/features/companies/pages/CompanyPage';
import { useCompanyNames } from '@/features/companies/use-company-names';
import { useJobsStore } from '@/features/jobs/job-store';
import { ApiError } from '@/lib/api-client';
import { notifyActionSuccess } from '@/lib/notifications';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'loaded'; details: CompanyDetails }
  | { kind: 'notFound' }
  | { kind: 'failed'; message: string };

export function CompanyRoute() {
  const { t } = useTranslation('companies');
  const navigate = useNavigate();
  const location = useLocation();
  const { name = '' } = useParams();
  const back = companiesBackPath(location.state);
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const existingNames = useCompanyNames();
  // Bumped by Retry, so the effect below runs again for the same name
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // A slower answer for a company left behind must not land on the next one
    let active = true;
    getCompanyDetails(name)
      .then((details) => {
        if (active) setState({ kind: 'loaded', details });
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 404) {
          setState({ kind: 'notFound' });
          return;
        }
        setState({
          kind: 'failed',
          message:
            error instanceof Error ? error.message : t('details.loadFailed')
        });
      });
    return () => {
      active = false;
    };
  }, [name, attempt, t]);

  const retry = () => {
    setState({ kind: 'loading' });
    setAttempt((value) => value + 1);
  };

  const goBack = () => navigate(back);

  if (state.kind === 'loaded') {
    return (
      <CompanyPage
        key={state.details.name}
        details={state.details}
        initialValues={toCompanyFormValues(state.details)}
        existingNames={existingNames}
        onSubmit={async (values, initialValues) => {
          await updateCompany(
            toUpdateCompanyInput(state.details, initialValues, values)
          );
          // A rename, the type and the blacklist all show on the applications list
          useJobsStore.getState().invalidateJobs();
          void useBlacklistStore.getState().reload();
        }}
        onSaved={() => {
          notifyActionSuccess('updated', 'company');
          goBack();
        }}
        onBack={goBack}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-[960px] px-4 py-7 sm:px-7">
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">
            {state.kind === 'loading'
              ? t('details.loading')
              : state.kind === 'notFound'
                ? t('details.notFoundTitle')
                : t('details.loadFailed')}
          </CardTitle>
          {state.kind === 'notFound' && (
            <CardDescription>{t('details.notFoundBody')}</CardDescription>
          )}
          {state.kind === 'failed' && (
            <CardDescription className="text-destructive">
              {state.message}
            </CardDescription>
          )}
          {state.kind !== 'loading' && (
            <div className="flex gap-2 pt-2">
              {state.kind === 'failed' && (
                <Button variant="outline" onClick={retry}>
                  {t('details.retry')}
                </Button>
              )}
              <Button variant="outline" onClick={goBack}>
                {t('details.back')}
              </Button>
            </div>
          )}
        </CardHeader>
      </Card>
    </main>
  );
}
