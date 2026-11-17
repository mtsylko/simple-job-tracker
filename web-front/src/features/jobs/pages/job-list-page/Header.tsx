import { Download, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { ROUTES } from '@/app/routes';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onExport: () => void;
}

export const Header = ({ onExport }: HeaderProps) => {
  const { t } = useTranslation('jobs');
  const navigate = useNavigate();
  // The filters travel with the form, so saving returns to the same list view.
  const { search } = useLocation();

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-4 pt-5 pb-4 sm:px-7 sm:pt-7 sm:pb-5">
      <h1 className="m-0 font-serif text-3xl font-normal leading-display tracking-tight text-foreground">
        {t('list.title')}
      </h1>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="lg"
          className="gap-1.5"
          onClick={onExport}
        >
          <Download className="size-3.5" aria-hidden="true" />
          {t('list.export')}
        </Button>
        <Button
          size="lg"
          onClick={() => navigate({ pathname: ROUTES.jobsCreate, search })}
          className="gap-1.5"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          {t('list.newApplication')}
        </Button>
      </div>
    </div>
  );
};
