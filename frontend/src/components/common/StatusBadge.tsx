interface StatusBadgeProps {
  tone: 'critical' | 'warning' | 'stable' | 'info';
  children: string;
}

const styles = {
  critical: 'bg-rose-100 text-rose-700',
  warning: 'bg-amber-100 text-amber-700',
  stable: 'bg-emerald-100 text-emerald-700',
  info: 'bg-sky-100 text-sky-700',
};

export default function StatusBadge({ tone, children }: StatusBadgeProps) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
}
