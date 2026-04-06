import { useEffect, useState } from 'react';
import { emergencyApi } from '../api';
import { CongestionPoint, Hospital, Patient } from '../types';

interface EmergencyAppDataState {
  hospitals: Hospital[];
  patientTemplate: Patient | null;
  congestionData: CongestionPoint[];
  loading: boolean;
  error: string | null;
}

export function useEmergencyAppData() {
  const [state, setState] = useState<EmergencyAppDataState>({
    hospitals: [],
    patientTemplate: null,
    congestionData: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;

    emergencyApi
      .getAppData()
      .then((data) => {
        if (!active) {
          return;
        }

        setState({
          hospitals: data.hospitals,
          patientTemplate: data.patientTemplate,
          congestionData: data.congestionData,
          loading: false,
          error: null,
        });
      })
      .catch((error: Error) => {
        if (!active) {
          return;
        }

        setState((current) => ({
          ...current,
          loading: false,
          error: error.message || '앱 데이터를 불러오지 못했습니다.',
        }));
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
