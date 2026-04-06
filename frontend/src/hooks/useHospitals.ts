import { useEffect, useState } from 'react';
import { fetchHospitals } from '@/api';
import type { HospitalSummary } from '@/types';

export function useHospitals() {
  const [hospitals, setHospitals] = useState<HospitalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHospitals()
      .then(setHospitals)
      .catch(() => setError('병원 데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  return { hospitals, loading, error };
}
