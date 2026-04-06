import { Hospital, Patient } from '../types';

// Mock 병원 데이터
export const mockHospitals: Hospital[] = [
  {
    id: 'h1',
    name: '서울대학교병원',
    address: '서울시 종로구 대학로 101',
    coordinates: { lat: 37.5799, lng: 127.0017 },
    beds: { general: 8, icu: 3, surgery: 2 },
    specialists: {
      cardiology: true,
      neurology: true,
      orthopedics: true,
      pediatrics: true,
      trauma: true,
    },
    departments: ['심장내과', '신경외과', '정형외과', '소아과', '외상외과'],
    currentWaitTime: 45,
    waitingPatients: 12,
    arrivingPatients: 3,
    equipment: { ct: true, mri: true, xray: true, ultrasound: true },
    distance: 2.3,
    estimatedTime: 8,
    congestionLevel: 'medium',
  },
  {
    id: 'h2',
    name: '삼성서울병원',
    address: '서울시 강남구 일원로 81',
    coordinates: { lat: 37.4886, lng: 127.0857 },
    beds: { general: 12, icu: 5, surgery: 4 },
    specialists: {
      cardiology: true,
      neurology: true,
      orthopedics: true,
      pediatrics: true,
      trauma: true,
    },
    departments: ['심장내과', '신경외과', '정형외과', '소아과', '응급의학과'],
    currentWaitTime: 30,
    waitingPatients: 8,
    arrivingPatients: 2,
    equipment: { ct: true, mri: true, xray: true, ultrasound: true },
    distance: 5.7,
    estimatedTime: 15,
    congestionLevel: 'low',
  },
  {
    id: 'h3',
    name: '세브란스병원',
    address: '서울시 서대문구 연세로 50-1',
    coordinates: { lat: 37.5625, lng: 126.9403 },
    beds: { general: 5, icu: 2, surgery: 1 },
    specialists: {
      cardiology: true,
      neurology: true,
      orthopedics: false,
      pediatrics: true,
      trauma: true,
    },
    departments: ['심장내과', '신경외과', '소아과', '응급의학과'],
    currentWaitTime: 60,
    waitingPatients: 18,
    arrivingPatients: 5,
    equipment: { ct: true, mri: true, xray: true, ultrasound: true },
    distance: 3.2,
    estimatedTime: 12,
    congestionLevel: 'high',
  },
  {
    id: 'h4',
    name: '서울아산병원',
    address: '서울시 송파구 올림픽로 43길 88',
    coordinates: { lat: 37.5267, lng: 127.1088 },
    beds: { general: 15, icu: 6, surgery: 5 },
    specialists: {
      cardiology: true,
      neurology: true,
      orthopedics: true,
      pediatrics: true,
      trauma: true,
    },
    departments: ['심장내과', '신경외과', '정형외과', '소아과', '외상외과', '응급의학과'],
    currentWaitTime: 25,
    waitingPatients: 6,
    arrivingPatients: 1,
    equipment: { ct: true, mri: true, xray: true, ultrasound: true },
    distance: 6.8,
    estimatedTime: 18,
    congestionLevel: 'low',
  },
  {
    id: 'h5',
    name: '강남세브란스병원',
    address: '서울시 강남구 언주로 211',
    coordinates: { lat: 37.5177, lng: 127.0471 },
    beds: { general: 6, icu: 2, surgery: 2 },
    specialists: {
      cardiology: true,
      neurology: false,
      orthopedics: true,
      pediatrics: false,
      trauma: true,
    },
    departments: ['심장내과', '정형외과', '응급의학과'],
    currentWaitTime: 40,
    waitingPatients: 10,
    arrivingPatients: 2,
    equipment: { ct: true, mri: false, xray: true, ultrasound: true },
    distance: 4.1,
    estimatedTime: 13,
    congestionLevel: 'medium',
  },
  {
    id: 'h6',
    name: '고려대학교 안암병원',
    address: '서울시 성북구 안암로 73',
    coordinates: { lat: 37.5867, lng: 127.0269 },
    beds: { general: 10, icu: 4, surgery: 3 },
    specialists: {
      cardiology: true,
      neurology: true,
      orthopedics: true,
      pediatrics: true,
      trauma: true,
    },
    departments: ['심장내과', '신경외과', '정형외과', '소아과', '응급의학과'],
    currentWaitTime: 35,
    waitingPatients: 9,
    arrivingPatients: 2,
    equipment: { ct: true, mri: true, xray: true, ultrasound: true },
    distance: 3.5,
    estimatedTime: 11,
    congestionLevel: 'low',
  },
];

// Mock 환자 데이터
export const mockPatient: Patient = {
  id: 'p1',
  name: '김환자',
  age: 45,
  gender: 'male',
  symptoms: '흉부 통증, 호흡곤란',
  severity: 'KTAS2',
  vitalSigns: {
    bloodPressure: '140/90',
    heartRate: 95,
    temperature: 37.2,
    oxygenSaturation: 94,
  },
};

// 혼잡도별 시간대 데이터
export const congestionData = [
  { time: '00:00', patients: 5 },
  { time: '02:00', patients: 3 },
  { time: '04:00', patients: 2 },
  { time: '06:00', patients: 4 },
  { time: '08:00', patients: 8 },
  { time: '10:00', patients: 12 },
  { time: '12:00', patients: 15 },
  { time: '14:00', patients: 14 },
  { time: '16:00', patients: 16 },
  { time: '18:00', patients: 18 },
  { time: '20:00', patients: 14 },
  { time: '22:00', patients: 10 },
  { time: '24:00', patients: 7 },
];

// AI 분석 템플릿
export const generateAIAnalysis = (hospital: Hospital, patient: Patient): string => {
  const reasons = [];
  
  if (hospital.beds.icu >= 3) {
    reasons.push('중환자실 병상이 충분합니다');
  }
  
  if (hospital.currentWaitTime < 40) {
    reasons.push('대기 시간이 비교적 짧습니다');
  }
  
  if (hospital.distance < 5) {
    reasons.push('환자 위치에서 가까운 거리에 있습니다');
  }
  
  if (patient.symptoms.includes('흉부') && hospital.specialists.cardiology) {
    reasons.push('심장내과 전문의가 상주하고 있습니다');
  }
  
  if (hospital.equipment.ct && hospital.equipment.mri) {
    reasons.push('필수 의료 장비가 모두 구비되어 있습니다');
  }
  
  return `[AI 분석]\n\n${hospital.name}은(는) 현재 환자에게 적합한 병원입니다.\n\n주요 근거:\n${reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n환자의 증상 "${patient.symptoms}"을(를) 고려할 때, 신속한 이송을 권장합니다.`;
};
