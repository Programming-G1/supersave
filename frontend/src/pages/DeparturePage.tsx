import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchHospital, registerDeparture } from '@/api';
import type { DepartureResponse, HospitalDetail, RequesterType, SeverityLevel } from '@/types';

const requesterLabels: Record<RequesterType, string> = {
  PARAMEDIC: '구급대원',
  PATIENT: '환자 본인',
  GUARDIAN: '보호자',
};

export default function DeparturePage() {
  const { hospitalId } = useParams();
  const [hospital, setHospital] = useState<HospitalDetail | null>(null);
  const [requesterType, setRequesterType] = useState<RequesterType>('PATIENT');
  const [severityLevel, setSeverityLevel] = useState<SeverityLevel>('KTAS3');
  const [patientName, setPatientName] = useState('김환자');
  const [symptomSummary, setSymptomSummary] = useState('흉통과 호흡 곤란');
  const [response, setResponse] = useState<DepartureResponse | null>(null);

  useEffect(() => {
    if (hospitalId) fetchHospital(Number(hospitalId)).then(setHospital);
  }, [hospitalId]);

  if (!hospital) {
    return <div className="rounded-[28px] bg-white p-6 text-sm text-slate-500">출발 등록 정보를 준비하는 중...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/80 bg-white/95 p-8 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)]">
        <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Departure Simulation</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">{hospital.name} 도착 예정 등록</h2>
        <p className="mt-3 text-sm text-slate-600">실제 예약 확정이 아니라 도착 예정 환자로 반영하는 가상 시뮬레이션입니다.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-600">
            요청 주체
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={requesterType} onChange={(event) => setRequesterType(event.target.value as RequesterType)}>
              {Object.entries(requesterLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-600">
            중증도
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={severityLevel} onChange={(event) => setSeverityLevel(event.target.value as SeverityLevel)}>
              {['KTAS1', 'KTAS2', 'KTAS3', 'KTAS4', 'KTAS5'].map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
            환자 이름
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={patientName} onChange={(event) => setPatientName(event.target.value)} />
          </label>
          <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
            증상 요약
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={symptomSummary} onChange={(event) => setSymptomSummary(event.target.value)} />
          </label>
        </div>

        <button
          className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white"
          onClick={async () =>
            setResponse(
              await registerDeparture({
                hospitalId: hospital.id,
                userLatitude: 37.5665,
                userLongitude: 126.978,
                etaMinutes: 12,
                patientName,
                requesterType,
                severityLevel,
                symptomSummary,
              }),
            )
          }
        >
          출발 등록 반영
        </button>
      </section>

      {response ? (
        <section className="rounded-[28px] bg-white p-6">
          <h3 className="text-xl font-semibold text-slate-950">가상 예약 시뮬레이션 결과</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">환자 이름 {response.patientName}</div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">요청 주체 {requesterLabels[response.requesterType]}</div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">ETA {response.etaMinutes}분</div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">대기열 순번 {response.queuePosition}</div>
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">예상 대기 {response.projectedWaitMinutes}분</div>
          <p className="mt-4 text-sm text-slate-600">{response.advisory}</p>
        </section>
      ) : null}
    </div>
  );
}
