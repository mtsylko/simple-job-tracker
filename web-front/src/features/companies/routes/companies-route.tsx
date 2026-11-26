import { parseAsStringLiteral, useQueryState } from 'nuqs';

import { CompaniesPage } from '@/features/companies/pages/CompaniesPage';
import { COMPANIES_TABS } from '@/features/companies/types';
import { useCompanies } from '@/features/companies/use-companies';

export function CompaniesRoute() {
  const { state, removeCompany, updateReason, removeFromBlacklist, reload } =
    useCompanies();
  // In the URL so the old /blacklist link can land on its tab.
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringLiteral(COMPANIES_TABS).withDefault('all')
  );

  return (
    <CompaniesPage
      state={state}
      tab={tab}
      onTabChange={(next) => void setTab(next)}
      onDelete={removeCompany}
      onUpdateReason={updateReason}
      onRemoveFromBlacklist={removeFromBlacklist}
      onBlacklisted={() => void reload({ silent: true })}
    />
  );
}
