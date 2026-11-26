import { useEffect, useState } from 'react';

import { listCompanies } from './companies-api';

/** Every company name in the list, so a form can refuse a taken one as it is typed. */
export function useCompanyNames(): string[] {
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    // Without the list the server's own check still refuses a taken name
    listCompanies()
      .then((companies) => {
        if (active) setNames(companies.map((company) => company.name));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return names;
}
