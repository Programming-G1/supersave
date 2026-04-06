import { apiClient, useMockApi } from '@/api/client';
import { mockAlerts, mockHospitals } from '@/data/mockData';
import type {
  AiGuideRequest,
  AiGuideResponse,
  AlertItem,
  DepartureRequest,
  DepartureResponse,
  HospitalDetail,
  HospitalSummary,
  RecommendationRequest,
  RecommendationResult,
} from '@/types';

const wait = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));
const toSummary = (hospital: HospitalDetail): HospitalSummary => ({ ...hospital });

function requireHospital(id?: number) {
  const hospital = id
    ? mockHospitals.find((item) => item.id === id)
    : mockHospitals[0];

  if (!hospital) {
    throw new Error('Mock hospital data is empty.');
  }

  return hospital;
}

export async function fetchHospitals() {
  if (useMockApi) {
    await wait();
    return mockHospitals.map(toSummary);
  }
  return (await apiClient.get<HospitalSummary[]>('/api/hospitals')).data;
}

export async function fetchHospital(id: number) {
  if (useMockApi) {
    await wait();
    return requireHospital(id);
  }
  return (await apiClient.get<HospitalDetail>(`/api/hospitals/${id}`)).data;
}

export async function fetchAlerts() {
  if (useMockApi) {
    await wait();
    return mockAlerts;
  }
  return (await apiClient.get<AlertItem[]>('/api/alerts')).data;
}

export async function fetchRecommendations(request: RecommendationRequest) {
  if (!useMockApi) {
    return (await apiClient.post<RecommendationResult[]>('/api/recommendations', request)).data;
  }

  await wait();
  return mockHospitals
    .map((hospital) => {
      const distanceKm = Math.hypot(request.latitude - hospital.latitude, request.longitude - hospital.longitude) * 100;
      const etaMinutes = Math.max(6, Math.round(distanceKm * 3.5));
      const severityScore = hospital.severityLevels.includes(request.severityLevel) ? 35 : 15;
      const bedScore = Math.min(hospital.availableBeds * 3, 30);
      const score = severityScore + bedScore + Math.max(0, 20 - etaMinutes / 2) + Math.max(0, 15 - hospital.estimatedWaitTimeMinutes / 4);

      return {
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        score: Math.round(score * 10) / 10,
        distanceKm: Math.round(distanceKm * 10) / 10,
        etaMinutes,
        estimatedWaitMinutes: hospital.estimatedWaitTimeMinutes,
        availableBeds: hospital.availableBeds,
        reason: `${hospital.severityLevels.includes(request.severityLevel) ? '선택 중증도 대응 가능' : '부분 대응 가능'} / ETA ${etaMinutes}분 / 예상 대기 ${hospital.estimatedWaitTimeMinutes}분`,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export async function registerDeparture(request: DepartureRequest) {
  if (!useMockApi) {
    return (await apiClient.post<DepartureResponse>('/api/departures', request)).data;
  }

  await wait();
  const hospital = requireHospital(request.hospitalId);
  return {
    registrationId: Date.now(),
    hospitalId: hospital.id,
    hospitalName: hospital.name,
    etaMinutes: request.etaMinutes ?? 12,
    queuePosition: hospital.currentPatients + hospital.incomingPatients + 1,
    projectedWaitMinutes: hospital.estimatedWaitTimeMinutes + 5,
    advisory: '가상 예약 시뮬레이션 결과이며 실제 접수 확정이 아닙니다.',
    createdAt: new Date().toISOString(),
  };
}

export async function requestAiGuide(request: AiGuideRequest) {
  if (!useMockApi) {
    return (await apiClient.post<AiGuideResponse>('/api/ai/guide', request)).data;
  }

  await wait();
  return {
    safetyDisclaimer: '이 응답은 의료 진단이 아니라 응급 의사결정 보조용 참고 정보입니다.',
    summary: `${request.symptomText} / ${request.severityLevel} 기준으로 응급실 선택 우선순위를 재정렬했습니다.`,
    recommendationReason: '병상 여유, 이동 시간, 중증도 수용 가능 범위를 함께 고려한 결과입니다.',
    actionGuide: ['의식과 호흡 여부를 먼저 확인하세요.', '기저질환과 복용약을 함께 준비하세요.', '증상 악화 시 즉시 119에 연락하세요.'],
    answer: request.userQuestion
      ? `질문 "${request.userQuestion}" 에 대한 MVP 응답입니다. Gemini 연동 시 더 정교한 비교 설명을 제공합니다.`
      : '현재 상태에서는 가까운 수용 가능 병원을 우선 비교하는 것이 좋습니다.',
  };
}
