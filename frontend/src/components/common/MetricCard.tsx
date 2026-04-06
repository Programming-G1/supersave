import type { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
}

export default function MetricCard({ title, value, description, icon }: MetricCardProps) {
  return (
    <div className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">{icon}</div>
      </div>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  );
}
