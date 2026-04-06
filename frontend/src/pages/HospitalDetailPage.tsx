import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchHospital } from '@/api';
import StatusBadge from '@/components/common/StatusBadge';
import type { HospitalDetail } from '@/types';

export default function HospitalDetailPage() {
  const { id } = useParams();
  const [hospital, setHospital] = useState<HospitalDetail | null>(null);

  useEffect(() => {
    if (id) fetchHospital(Number(id)).then(setHospital);
  }, [id]);

  if (!hospital) {
    return <div className="rounded-[28px] bg-white p-6 text-sm text-slate-500">병원 정보를 불러오는 중...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/80 bg-white/95 p-8 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-400">{hospital.region}</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">{hospital.name}</h2>
            <p className="mt-3 text-sm text-slate-600">{hospital.address} · {hospital.phone}</p>
          </div>
          <StatusBadge tone={hospital.availableBeds <= 5 ? 'warning' : 'stable'}>{hospital.availableBeds} beds</StatusBadge>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">예상 대기시간 {hospital.estimatedWaitTimeMinutes}분</div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">현재 환자 {hospital.currentPatients}명 / 도착 예정 {hospital.incomingPatients}명</div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">처리 속도 시간당 {hospital.processingRatePerHour}명</div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[28px] bg-white p-6">
          <h3 className="text-xl font-semibold text-slate-950">진료 과목</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {hospital.departments.map((department) => (
              <span key={department} className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700">{department}</span>
            ))}
          </div>
        </div>
        <div className="rounded-[28px] bg-white p-6">
          <h3 className="text-xl font-semibold text-slate-950">장비 현황</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {hospital.equipmentStatus.map((equipment) => (
              <span key={equipment} className="rounded-full bg-rose-50 px-3 py-2 text-sm text-rose-700">{equipment}</span>
            ))}
          </div>
        </div>
      </section>

      <Link to={`/departures/${hospital.id}`} className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white">
        출발 등록 / 가상 예약 진행
      </Link>
    </div>
  );
}
