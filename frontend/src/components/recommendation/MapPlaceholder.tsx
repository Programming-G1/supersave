import type { RecommendationResult } from '@/types';

interface MapPlaceholderProps {
  results: RecommendationResult[];
}

export default function MapPlaceholder({ results }: MapPlaceholderProps) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(140deg,#fff,#eef6ff)] p-6">
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,#0f172a_1px,transparent_0)] [background-size:24px_24px]" />
      <div className="relative">
        <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Map Placeholder</p>
        <h3 className="mt-3 text-2xl font-semibold text-slate-950">Kakao Map 연동 전 시각화 영역</h3>
        <p className="mt-3 max-w-2xl text-sm text-slate-600">현재는 추천 병원을 우선순위 순서대로 표시합니다. 실제 연동 시 마커, 이동 경로, 실시간 혼잡도 레이어를 이 영역에 연결하면 됩니다.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {results.map((result, index) => (
            <div key={result.hospitalId} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow">
              #{index + 1} {result.hospitalName}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
