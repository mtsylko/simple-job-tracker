export function TextCell({ value }: { value: string }) {
  const trimmed = value.trim();
  return (
    <span className="text-foreground/80">
      {trimmed.length > 0 ? trimmed : '—'}
    </span>
  );
}
