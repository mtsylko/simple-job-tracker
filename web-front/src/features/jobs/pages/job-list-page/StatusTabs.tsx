import { useTranslation } from 'react-i18next';

import { PageTabs, type PageTab } from '@/components/PageTabs';

import { ALL_TAB, type TabKey } from './use-job-list-filters';

interface StatusTabsProps {
  activeTab: TabKey;
  /** Status values shown as tabs, in display order. */
  tabStatuses: string[];
  counts: Record<TabKey, number>;
  onChange: (tab: TabKey) => void;
}

export const StatusTabs = ({
  activeTab,
  tabStatuses,
  counts,
  onChange
}: StatusTabsProps) => {
  const { t } = useTranslation('jobs');

  const tabs: PageTab<TabKey>[] = [
    { key: ALL_TAB, label: t('list.tabs.all'), count: counts[ALL_TAB] ?? 0 },
    // A status value is its own label (user-authored), so it is shown verbatim.
    ...tabStatuses.map((status) => ({
      key: status,
      label: status,
      count: counts[status] ?? 0
    }))
  ];

  return <PageTabs tabs={tabs} value={activeTab} onChange={onChange} />;
};
