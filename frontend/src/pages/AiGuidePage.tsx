import { useState } from 'react';
import { requestAiGuide } from '@/api';
import GuideResponseCard from '@/components/ai/GuideResponseCard';
import type { AiGuideResponse, SeverityLevel } from '@/types';

export default function AiGuidePage() {
  const [severityLevel, setSeverityLevel] = useState<SeverityLevel>('KTAS3');
  const [symptomText, setSymptomText] = useState('가슴 통증과 식은땀');
  const [userQuestion, setUserQuestion] = useState('왜 이 병원이 더 적합한가요?');
  const [response, setResponse] = useState<AiGuideResponse | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[32px] border border-white/80 bg-white/95 p-8 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)]">
        <p className="text-sm uppercase tracking-[0.28em] text-slate-400">AI Decision Support</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">증상 기반 응급 가이드와 자연어 질의응답</h2>

        <div className="mt-6 space-y-4">
          <label className="space-y-2 text-sm text-slate-600">
            증상/상태
            <textarea className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3" value={symptomText} onChange={(event) => setSymptomText(event.target.value)} />
          </label>
          <label className="space-y-2 text-sm text-slate-600">
            중증도
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={severityLevel} onChange={(event) => setSeverityLevel(event.target.value as SeverityLevel)}>
              {['KTAS1', 'KTAS2', 'KTAS3', 'KTAS4', 'KTAS5'].map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-600">
            자연어 질문
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={userQuestion} onChange={(event) => setUserQuestion(event.target.value)} />
          </label>
        </div>

        <button
          className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white"
          onClick={async () => setResponse(await requestAiGuide({ symptomText, severityLevel, userQuestion }))}
        >
          AI 가이드 생성
        </button>
      </section>

      <GuideResponseCard response={response} />
    </div>
  );
}
