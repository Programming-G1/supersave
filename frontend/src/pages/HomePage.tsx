import { ArrowRight, BrainCircuit, MapPinned, Siren } from 'lucide-react';
import { Link } from 'react-router-dom';
import MetricCard from '@/components/common/MetricCard';
import HospitalCard from '@/components/hospital/HospitalCard';
import { useHospitals } from '@/hooks/useHospitals';

export default function HomePage() {
  const { hospitals, loading } = useHospitals();
  const availableBeds = hospitals.reduce((sum, hospital) => sum + hospital.availableBeds, 0);
  const avgWait = hospitals.length ? Math.round(hospitals.reduce((sum, hospital) => sum + hospital.estimatedWaitTimeMinutes, 0) / hospitals.length) : 0;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[36px] bg-[linear-gradient(135deg,#0f172a,#0f766e_45%,#ef4444)] p-8 text-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.8)]">
          <p className="text-sm uppercase tracking-[0.32em] text-white/70">Emergency matching MVP</p>
          <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight">실시간 병상 정보와 AI 설명을 결합한 응급실 추천 흐름을 한 번에 보여줍니다.</h2>
          <p className="mt-4 max-w-2xl text-sm text-white/80">공공데이터 기반 응급실 현황, 예상 ETA, 가상 도착 등록, 자연어 가이드까지 발표 가능한 형태로 묶은 SuperSave MVP입니다.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/emergency" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-950">
              응급 상황 시작
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/ai-guide" className="rounded-full border border-white/30 px-5 py-3 text-sm font-medium text-white">AI 가이드 보기</Link>
          </div>
        </div>

        <div className="grid gap-4">
          <MetricCard title="가용 병상" value={loading ? '...' : `${availableBeds}`} description="현재 mock 데이터 기반 총 가용 병상 수" icon={<MapPinned className="h-5 w-5" />} />
          <MetricCard title="평균 대기시간" value={loading ? '...' : `${avgWait}분`} description="현재 추천 대상 병원 평균 예상 대기시간" icon={<Siren className="h-5 w-5" />} />
          <MetricCard title="AI 보조 응답" value="MVP" description="Gemini 연동 전 템플릿 응답과 TODO 포인트 포함" icon={<BrainCircuit className="h-5 w-5" />} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {['스마트 이송 추천', '가상 도착 등록', 'AI 의사결정 지원'].map((feature) => (
          <div key={feature} className="rounded-[28px] border border-white/80 bg-white/95 p-6 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)]">
            <p className="text-lg font-semibold text-slate-950">{feature}</p>
            <p className="mt-3 text-sm text-slate-600">거리, 병상, 중증도 수용 범위와 설명형 UI를 함께 보여주는 발표용 시나리오에 맞춰 설계했습니다.</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Preview Hospitals</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-950">시연에 사용할 대표 응급실 카드</h3>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {hospitals.map((hospital) => (
            <HospitalCard key={hospital.id} hospital={hospital} />
          ))}
        </div>
      </section>
    </div>
  );
}
