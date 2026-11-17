import { statusBadgeStyle } from '@/features/jobs/status-badge-colors';

export function StatusBadge({
  status,
  color
}: {
  status: string;
  color: string;
}) {
  if (!status) {
    return null;
  }
  const style = statusBadgeStyle(color);
  return (
    <span className="status-badge" style={style.badge}>
      <span className="status-badge-dot" style={style.dot} />
      {status}
    </span>
  );
}
