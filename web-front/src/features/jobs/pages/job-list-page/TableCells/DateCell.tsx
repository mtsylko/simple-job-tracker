export function DateCell({ value }: { value: string }) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? (
    <span className="num text-sm text-foreground/80">{trimmed}</span>
  ) : (
    <span className="text-muted-foreground">—</span>
  );
}
