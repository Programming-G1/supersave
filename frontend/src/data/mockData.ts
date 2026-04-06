import type { AlertItem, HospitalDetail } from '@/types';

export const mockHospitals: HospitalDetail[] = [
  {
    id: 1,
    name: '서울대학교병원 권역응급의료센터',
    address: '서울 종로구 대학로 101',
    phone: '02-2072-2114',
    latitude: 37.5796,
    longitude: 126.9989,
    availableBeds: 8,
    severityLevels: ['KTAS1', 'KTAS2', 'KTAS3', 'KTAS4'],
    availableSpecialists: ['응급의학과', '심장내과', '신경외과', '외상외과'],
    departments: ['응급의학과', '심장내과', '신경외과', '정형외과'],
    equipmentStatus: ['CT 가능', 'MRI 가능', '인공호흡기 가능'],
    currentPatients: 18,
    incomingPatients: 3,
    processingRatePerHour: 7.5,
    estimatedWaitTimeMinutes: 30,
    region: '서울 종로구',
  },
  {
    id: 4,
    name: '서울아산병원 응급실',
    address: '서울 송파구 올림픽로43길 88',
    phone: '1688-7575',
    latitude: 37.5262,
    longitude: 127.1087,
    availableBeds: 15,
    severityLevels: ['KTAS1', 'KTAS2', 'KTAS3'],
    availableSpecialists: ['응급의학과', '외상외과', '심장내과', '신경외과'],
    departments: ['응급의학과', '중환자의학', '외상외과', '흉부외과'],
    equipmentStatus: ['CT 가능', 'MRI 가능', '수술실 가능'],
    currentPatients: 10,
    incomingPatients: 1,
    processingRatePerHour: 9.5,
    estimatedWaitTimeMinutes: 18,
    region: '서울 송파구',
  },
];

export const mockAlerts: AlertItem[] = [
  {
    id: 'beds-1',
    level: 'WARNING',
    title: '병상 변동 주의',
    message: '종로권 응급실 병상 변동이 커서 추천 결과를 수시로 다시 확인해야 합니다.',
    region: '서울 종로구',
    createdAt: new Date().toISOString(),
  },
];
