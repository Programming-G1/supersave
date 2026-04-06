import {
  AppDataResponse,
  ArrivingPatient,
  HospitalRecommendation,
  Patient,
  TransferResponse,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || '요청 처리 중 오류가 발생했습니다.');
  }

  return response.json() as Promise<T>;
}

export const emergencyApi = {
  getAppData() {
    return request<AppDataResponse>('/api/app-data');
  },

  getArrivals(hospitalId: string) {
    return request<ArrivingPatient[]>(`/api/hospitals/${hospitalId}/arrivals`);
  },

  getRecommendations(patient: Patient) {
    return request<HospitalRecommendation[]>('/api/recommendations', {
      method: 'POST',
      body: JSON.stringify({ patient }),
    });
  },

  createTransfer(hospitalId: string, patient: Patient) {
    return request<TransferResponse>('/api/transfers', {
      method: 'POST',
      body: JSON.stringify({ hospitalId, patient }),
    });
  },

  updateArrivalStatus(arrivalId: string, status: ArrivingPatient['status']) {
    return request<ArrivingPatient>(`/api/arrivals/${arrivalId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
