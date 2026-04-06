import { useEffect, useState } from 'react';
import { fetchRecommendations } from '@/api';
import HospitalCard from '@/components/hospital/HospitalCard';
import MapPlaceholder from '@/components/recommendation/MapPlaceholder';
import RecommendationForm from '@/components/recommendation/RecommendationForm';
import { useHospitals } from '@/hooks/useHospitals';
import type { RecommendationRequest, RecommendationResult } from '@/types';

export default function EmergencySearchPage() {
  const { hospitals, loading } = useHospitals();
  const [results, setResults] = useState<RecommendationResult[]>([]);

  useEffect(() => {
    const request: RecommendationRequest = {
      latitude: 37.5665,
      longitude: 126.978,
      severityLevel: 'KTAS3',
      symptomSummary: '흉통과 호흡 곤란',
    };
    fetchRecommendations(request).then(setResults);
  }, []);

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Emergency Search</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">현재 위치와 중증도를 기준으로 추천 병원을 다시 계산합니다.</h2>
      </section>

      <RecommendationForm onSubmit={async (request) => setResults(await fetchRecommendations(request))} />
      <MapPlaceholder results={results} />

      <section className="grid gap-4 lg:grid-cols-2">
        {loading ? <div className="rounded-[28px] bg-white p-6 text-sm text-slate-500">병원 정보를 불러오는 중...</div> : null}
        {!loading &&
          hospitals.map((hospital) => (
            <HospitalCard key={hospital.id} hospital={hospital} recommendation={results.find((result) => result.hospitalId === hospital.id)} />
          ))}
      </section>
    </div>
  );
}
