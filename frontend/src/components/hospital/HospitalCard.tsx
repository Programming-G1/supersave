import { ArrowRight, BedDouble, Clock3, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/common/StatusBadge';
import type { HospitalSummary, RecommendationResult } from '@/types';
import { formatDistance, formatMinutes } from '@/utils/format';

interface HospitalCardProps {
  hospital: HospitalSummary;
  recommendation?: RecommendationResult;
}

export default function HospitalCard({ hospital, recommendation }: HospitalCardProps) {
  const tone = hospital.availableBeds <= 2 ? 'critical' : hospital.availableBeds <= 5 ? 'warning' : 'stable';

  return (
    <article className="rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{hospital.name}</h3>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <MapPin className="h-4 w-4" />
            {hospital.address}
          </p>
        </div>
        <StatusBadge tone={tone}>{hospital.region}</StatusBadge>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
          <BedDouble className="mb-2 h-4 w-4" />
          가용 병상 {hospital.availableBeds}
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
          <Clock3 className="mb-2 h-4 w-4" />
          예상 대기 {formatMinutes(hospital.estimatedWaitTimeMinutes)}
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
          <Phone className="mb-2 h-4 w-4" />
          {hospital.phone}
        </div>
      </div>

      {recommendation ? (
        <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-950">
          <p className="font-semibold">추천 점수 {recommendation.score}</p>
          <p className="mt-1">{recommendation.reason}</p>
          <p className="mt-2 text-rose-700">
            거리 {formatDistance(recommendation.distanceKm)} / ETA {formatMinutes(recommendation.etaMinutes)}
          </p>
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm text-slate-500">{hospital.availableSpecialists.join(', ')}</p>
        <Link to={`/hospitals/${hospital.id}`} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white">
          상세 보기
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
