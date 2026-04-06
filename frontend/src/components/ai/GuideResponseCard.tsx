import type { AiGuideResponse } from '@/types';

interface GuideResponseCardProps {
  response: AiGuideResponse | null;
}

export default function GuideResponseCard({ response }: GuideResponseCardProps) {
  if (!response) return null;

  return (
    <div className="rounded-[32px] border border-white/80 bg-white/95 p-6 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)]">
      <p className="text-sm font-medium text-rose-700">{response.safetyDisclaimer}</p>
      <h3 className="mt-4 text-2xl font-semibold text-slate-950">AI 응급 가이드</h3>
      <p className="mt-3 text-sm text-slate-600">{response.summary}</p>
      <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">{response.recommendationReason}</p>
      <ul className="mt-5 space-y-2 text-sm text-slate-700">
        {response.actionGuide.map((item) => (
          <li key={item} className="rounded-2xl bg-rose-50 px-4 py-3">{item}</li>
        ))}
      </ul>
      <p className="mt-5 text-sm text-slate-700">{response.answer}</p>
    </div>
  );
}
