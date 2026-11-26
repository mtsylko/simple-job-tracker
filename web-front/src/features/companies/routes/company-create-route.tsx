import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useBlacklistStore } from '@/features/companies/blacklist-store';
import { createCompany } from '@/features/companies/companies-api';
import {
  companiesBackPath,
  startsAvoided
} from '@/features/companies/company-paths';
import {
  emptyCompanyFormValues,
  toCreateCompanyInput
} from '@/features/companies/components/CompanyPage/company-form';
import { CompanyPage } from '@/features/companies/pages/CompanyPage';
import { useCompanyNames } from '@/features/companies/use-company-names';
import { notifyActionSuccess } from '@/lib/notifications';

export function CompanyCreateRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const back = companiesBackPath(location.state);
  // Read once: the state stays with this history entry, not with the form
  const [initialValues] = useState(() =>
    emptyCompanyFormValues(startsAvoided(location.state))
  );
  const existingNames = useCompanyNames();
  const goBack = () => navigate(back);

  return (
    <CompanyPage
      details={null}
      initialValues={initialValues}
      existingNames={existingNames}
      onSubmit={async (values) => {
        await createCompany(toCreateCompanyInput(values));
        // The applications list marks blacklisted companies from this store
        void useBlacklistStore.getState().reload();
      }}
      onSaved={() => {
        notifyActionSuccess('created', 'company');
        goBack();
      }}
      onBack={goBack}
    />
  );
}
