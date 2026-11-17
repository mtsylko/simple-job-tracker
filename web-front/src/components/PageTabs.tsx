import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface PageTab<K extends string> {
  key: K;
  label: string;
  /** Left out where the tab names a section rather than a filtered list. */
  count?: number;
}

interface PageTabsProps<K extends string> {
  tabs: readonly PageTab<K>[];
  value: K;
  onChange: (key: K) => void;
}

/**
 * Shared list-page tab bar. Every list page renders the same markup so the tab
 * strip keeps an identical height and the content below never shifts when
 * navigating between pages.
 */
export function PageTabs<K extends string>({
  tabs,
  value,
  onChange
}: PageTabsProps<K>) {
  return (
    <Tabs
      className="gap-0"
      value={value}
      onValueChange={(next) => onChange(next as K)}
    >
      <TabsList className="jt-tabs h-auto w-full justify-start rounded-none bg-transparent p-0">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.key}
            value={tab.key}
            className="jt-tab h-auto flex-none rounded-none border-0 bg-transparent font-normal shadow-none data-[active]:bg-transparent data-[active]:shadow-none"
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="jt-tab-count">{tab.count}</span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
