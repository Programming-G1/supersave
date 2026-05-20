import { apiClient, useMockApi } from '@/api/client';
import { inferSeverityByKeywords } from '@/app/utils/severity';
import { mockAlerts, mockHospitals } from '@/data/mockData';
import type {
  AiGuideRequest,
  AiGuideResponse,
  AiSeverityRequest,
  AiSeverityResponse,
  AlertItem,
  DepartureQueueItem,
  DepartureRequest,
  DepartureResponse,
  DepartureStatus,
  HospitalDetail,
  HospitalSummary,
  LocationSearchResult,
  RecommendationRequest,
  RecommendationResult,
} from '@/types';

const wait = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));
const toSummary = (hospital: HospitalDetail): HospitalSummary => ({ ...hospital });
let mockDepartureQueue: DepartureQueueItem[] = [
  {
    registrationId: 1001,
    hospitalId: 1,
    hospitalName: '서울대학교병원 권역응급의료센터',
    patientName: '김철수',
    requesterType: 'PARAMEDIC',
    etaMinutes: 8,
    severityLevel: 'KTAS2',
    symptomSummary: '급성 흉통, 호흡곤란',
    createdAt: '2026-04-06T14:23:00',
    status: 'PENDING',
  },
  {
    registrationId: 1002,
    hospitalId: 1,
    hospitalName: '서울대학교병원 권역응급의료센터',
    patientName: '이영희',
    requesterType: 'GUARDIAN',
    etaMinutes: 15,
    severityLevel: 'KTAS3',
    symptomSummary: '낙상 후 우측 고관절 통증',
    createdAt: '2026-04-06T14:30:00',
    status: 'PENDING',
  },
  {
    registrationId: 1003,
    hospitalId: 4,
    hospitalName: '서울아산병원 응급실',
    patientName: '최지은',
    requesterType: 'PATIENT',
    etaMinutes: 12,
    severityLevel: 'KTAS2',
    symptomSummary: '뇌졸중 의심 증상',
    createdAt: '2026-04-06T14:18:00',
    status: 'ACCEPTED',
  },
];

function buildFallbackSeverityResponse(request: AiSeverityRequest): AiSeverityResponse {
  if (request.oxygenSaturation !== undefined && request.oxygenSaturation < 90) {
    return { severityLevel: 'KTAS1', source: 'FALLBACK' };
  }

  if (request.heartRate !== undefined && (request.heartRate < 45 || request.heartRate > 140)) {
    return { severityLevel: 'KTAS2', source: 'FALLBACK' };
  }

  const systolicPressure = request.bloodPressure
    ? Number.parseInt(request.bloodPressure.split('/')[0] ?? '', 10)
    : Number.NaN;
  if (!Number.isNaN(systolicPressure) && systolicPressure < 90) {
    return { severityLevel: 'KTAS2', source: 'FALLBACK' };
  }

  if (request.temperature !== undefined && request.temperature >= 39.5) {
    return { severityLevel: 'KTAS3', source: 'FALLBACK' };
  }

  return { severityLevel: 'KTAS3', source: 'FALLBACK' };
}

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

export async function searchLocations(query: string) {
  if (useMockApi) {
    await wait();
    return [
      {
        name: query,
        address: '서울 중구 세종대로 110',
        roadAddress: '서울 중구 세종대로 110',
        latitude: 37.5665,
        longitude: 126.9780,
      },
    ] satisfies LocationSearchResult[];
  }

  return (await apiClient.get<LocationSearchResult[]>('/api/locations/search', {
    params: { query },
  })).data;
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
        totalEstimatedMinutes: etaMinutes + hospital.estimatedWaitTimeMinutes,
        availableBeds: hospital.availableBeds,
        intensiveCareBeds: hospital.intensiveCareBeds ?? 0,
        surgeryBeds: hospital.surgeryBeds ?? 0,
        reason: `${hospital.severityLevels.includes(request.severityLevel) ? '선택 중증도 대응 가능' : '부분 대응 가능'} / 이동 ${etaMinutes}분 / 대기 ${hospital.estimatedWaitTimeMinutes}분 / 총 소요 ${etaMinutes + hospital.estimatedWaitTimeMinutes}분`,
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
  const response = {
    registrationId: Date.now(),
    hospitalId: hospital.id,
    hospitalName: hospital.name,
    patientName: request.patientName,
    requesterType: request.requesterType,
    etaMinutes: request.etaMinutes ?? 12,
    queuePosition: hospital.currentPatients + hospital.incomingPatients + 1,
    projectedWaitMinutes: hospital.estimatedWaitTimeMinutes + 5,
    advisory: '가상 예약 시뮬레이션 결과이며 실제 접수 확정이 아닙니다.',
    createdAt: new Date().toISOString(),
  };

  mockDepartureQueue = [
    {
      registrationId: response.registrationId,
      hospitalId: response.hospitalId,
      hospitalName: response.hospitalName,
      patientName: response.patientName,
      requesterType: response.requesterType,
      etaMinutes: response.etaMinutes,
      severityLevel: request.severityLevel,
      symptomSummary: request.symptomSummary,
      createdAt: response.createdAt,
      status: 'PENDING',
    },
    ...mockDepartureQueue,
  ];

  return response;
}

export async function fetchHospitalDepartures(hospitalId: number) {
  if (useMockApi) {
    await wait();
    return mockDepartureQueue.filter((item) => item.hospitalId === hospitalId);
  }

  return (await apiClient.get<DepartureQueueItem[]>('/api/departures', { params: { hospitalId } })).data;
}

export async function updateDepartureStatus(registrationId: number, status: DepartureStatus) {
  if (useMockApi) {
    await wait();
    mockDepartureQueue = mockDepartureQueue.map((item) =>
      item.registrationId === registrationId ? { ...item, status } : item,
    );
    const updated = mockDepartureQueue.find((item) => item.registrationId === registrationId);
    if (!updated) {
      throw new Error('출발 요청을 찾을 수 없습니다.');
    }
    return updated;
  }

  return (await apiClient.post<DepartureQueueItem>(`/api/departures/${registrationId}/status`, { status })).data;
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

export async function requestAiSeverity(request: AiSeverityRequest) {
  if (useMockApi) {
    await wait();
    return buildFallbackSeverityResponse(request);
  }

  return (await apiClient.post<AiSeverityResponse>('/api/ai/severity', request)).data;
}

export async function resolveSeverityLevel(request: AiSeverityRequest): Promise<AiSeverityResponse> {
  const keywordInference = inferSeverityByKeywords(request.symptomText);
  if (keywordInference.matched) {
    return {
      severityLevel: keywordInference.severityLevel,
      source: 'KEYWORD',
    };
  }

  try {
    return await requestAiSeverity(request);
  } catch {
    return buildFallbackSeverityResponse(request);
  }
}
