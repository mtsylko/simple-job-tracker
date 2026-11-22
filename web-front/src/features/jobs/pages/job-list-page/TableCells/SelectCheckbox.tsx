import { Checkbox } from '@/components/ui/checkbox';

/** The label fills the cell, so a near miss toggles the box instead of opening the row. */
export function SelectCheckbox({
  checked,
  indeterminate = false,
  label,
  onCheckedChange
}: {
  checked: boolean;
  indeterminate?: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex h-full w-full cursor-pointer items-center justify-center">
      <Checkbox
        checked={checked}
        indeterminate={indeterminate}
        aria-label={label}
        onCheckedChange={(next) => onCheckedChange(next)}
        // The primitive only draws a check, so a partial selection swaps it for a dash
        className="relative data-[indeterminate]:border-primary data-[indeterminate]:bg-primary data-[indeterminate]:[&_svg]:hidden data-[indeterminate]:after:absolute data-[indeterminate]:after:inset-x-[3px] data-[indeterminate]:after:top-1/2 data-[indeterminate]:after:h-0.5 data-[indeterminate]:after:-translate-y-1/2 data-[indeterminate]:after:rounded-full data-[indeterminate]:after:bg-primary-foreground"
      />
    </label>
  );
}
