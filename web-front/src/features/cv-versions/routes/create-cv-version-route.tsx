import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@/app/routes';
import { CvVersionFormPage } from '@/features/cv-versions/pages/cv-version-form-page';
import { useCvVersionsStore } from '@/features/cv-versions/cv-version-store';
import type { CvVersionFormValues } from '@/features/cv-versions/types';
import { notifyActionSuccess } from '@/lib/notifications';

export function CreateCvVersionRoute() {
  const navigate = useNavigate();
  const createCvVersion = useCvVersionsStore((state) => state.createCvVersion);

  async function handleSubmit(values: CvVersionFormValues) {
    await createCvVersion(values);
    notifyActionSuccess('created', 'cvVersion');
    navigate(ROUTES.cvVersions);
  }

  function handleCancel() {
    navigate(ROUTES.cvVersions);
  }

  return (
    <CvVersionFormPage
      mode="create"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
