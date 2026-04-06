export function formatMinutes(value: number) {
  return `${value}분`;
}

export function formatDistance(value: number) {
  return `${value.toFixed(1)}km`;
}

export function alertTone(level: 'NORMAL' | 'INFO' | 'WARNING') {
  if (level === 'WARNING') return 'bg-amber-100 text-amber-900';
  if (level === 'INFO') return 'bg-sky-100 text-sky-900';
  return 'bg-emerald-100 text-emerald-900';
}
