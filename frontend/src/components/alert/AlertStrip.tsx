import type { AlertItem } from '@/types';
import { alertTone } from '@/utils/format';

interface AlertStripProps {
  alert: AlertItem;
}

export default function AlertStrip({ alert }: AlertStripProps) {
  return (
    <div className="rounded-[24px] border border-white/80 bg-white/95 p-5 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-slate-950">{alert.title}</p>
          <p className="mt-2 text-sm text-slate-600">{alert.message}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${alertTone(alert.level)}`}>{alert.level}</span>
      </div>
      <p className="mt-3 text-sm text-slate-500">{alert.region}</p>
    </div>
  );
}
