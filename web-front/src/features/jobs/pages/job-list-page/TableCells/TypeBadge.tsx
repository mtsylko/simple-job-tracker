export function TypeBadge({ value }: { value: string }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-transparent px-2 py-0.5 text-xs font-medium text-foreground/80">
      {value}
    </span>
  );
}
