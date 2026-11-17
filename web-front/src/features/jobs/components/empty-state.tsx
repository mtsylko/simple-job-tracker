import { BriefcaseBusiness } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState as EmptyStateLayout } from '@/components/EmptyState';

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation('jobs');

  const features = [
    {
      key: 'capture',
      title: t('empty.features.capture.title'),
      description: t('empty.features.capture.description')
    },
    {
      key: 'funnel',
      title: t('empty.features.funnel.title'),
      description: t('empty.features.funnel.description')
    },
    {
      key: 'stayOut',
      title: t('empty.features.stayOut.title'),
      description: t('empty.features.stayOut.description')
    }
  ];

  return (
    <EmptyStateLayout
      icon={BriefcaseBusiness}
      title={t('empty.title')}
      subtitle={t('empty.subtitle')}
      ctaLabel={t('empty.cta')}
      features={features}
      onAdd={onAdd}
    />
  );
}
