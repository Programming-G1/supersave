import { LocateFixed, Search } from 'lucide-react';
import { useState } from 'react';
import type { RecommendationRequest, SeverityLevel } from '@/types';

interface RecommendationFormProps {
  onSubmit: (request: RecommendationRequest) => void;
}

const severityOptions: SeverityLevel[] = ['KTAS1', 'KTAS2', 'KTAS3', 'KTAS4', 'KTAS5'];

export default function RecommendationForm({ onSubmit }: RecommendationFormProps) {
  const [form, setForm] = useState<RecommendationRequest>({
    latitude: 37.5665,
    longitude: 126.978,
    severityLevel: 'KTAS3',
    symptomSummary: '흉통과 호흡 곤란',
  });

  return (
    <form
      className="rounded-[32px] border border-white/80 bg-white/95 p-6 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)]"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(form);
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-600">
          현재 위도
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="number" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: Number(event.target.value) })} />
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          현재 경도
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="number" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: Number(event.target.value) })} />
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          중증도
          <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.severityLevel} onChange={(event) => setForm({ ...form, severityLevel: event.target.value as SeverityLevel })}>
            {severityOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          증상 요약
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.symptomSummary} onChange={(event) => setForm({ ...form, symptomSummary: event.target.value })} />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white">
          <Search className="h-4 w-4" />
          추천 다시 계산
        </button>
        <button type="button" className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-700" onClick={() => setForm({ ...form, latitude: 37.5665, longitude: 126.978 })}>
          <LocateFixed className="h-4 w-4" />
          서울 시청 기준 위치
        </button>
      </div>
    </form>
  );
}
