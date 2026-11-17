import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DEFAULT_ANALYTICS_RANGE,
  getAnalyticsRangeOptions,
  type AnalyticsRange
} from '@/features/analytics/use-analytics-range';

type AnalyticsRangePickerProps = {
  value: AnalyticsRange;
  onChange: (range: AnalyticsRange) => void;
};

/** Presentational: the page owns the range, since it also filters by it. */
export function AnalyticsRangePicker({
  value,
  onChange
}: AnalyticsRangePickerProps) {
  const { t } = useTranslation('analytics');
  const options = useMemo(() => getAnalyticsRangeOptions(t), [t]);
  const selected = options.find((option) => option.value === value);

  return (
    <Select
      value={value}
      onValueChange={(next) =>
        onChange((next ?? DEFAULT_ANALYTICS_RANGE) as AnalyticsRange)
      }
    >
      {/* Fixed width, so the trigger does not resize between labels. */}
      <SelectTrigger id="analytics-range" className="w-44">
        <SelectValue>{selected?.label ?? ''}</SelectValue>
      </SelectTrigger>
      {/* Opens below the trigger rather than over it: aligning the selected
          item with the trigger clips this list against the top of the page. */}
      <SelectContent align="start" alignItemWithTrigger={false}>
        {/* `pr-7` keeps the label clear of the tick; no leading spacer, as
            there is no icon row here for labels to line up with. */}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="pr-7">
            <span>{option.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
