import type { Patient } from '../types';

export function inferSeverityFromSymptoms(symptoms: string): Patient['severity'] {
  const normalizedSymptoms = symptoms.toLowerCase();

  if (isSimpleHangoverSymptoms(normalizedSymptoms)) {
    return inferHangoverSeverity(normalizedSymptoms);
  }

  if (
    normalizedSymptoms.includes('심정지') ||
    normalizedSymptoms.includes('의식') ||
    normalizedSymptoms.includes('의식저하') ||
    normalizedSymptoms.includes('경련') ||
    normalizedSymptoms.includes('쇼크') ||
    normalizedSymptoms.includes('호흡 없음') ||
    normalizedSymptoms.includes('호흡없') ||
    normalizedSymptoms.includes('대량출혈')
  ) {
    return 'KTAS1';
  }

  if (
    normalizedSymptoms.includes('흉통') ||
    normalizedSymptoms.includes('흉부') ||
    normalizedSymptoms.includes('가슴') ||
    normalizedSymptoms.includes('심장') ||
    normalizedSymptoms.includes('호흡곤란') ||
    normalizedSymptoms.includes('숨') ||
    normalizedSymptoms.includes('마비') ||
    normalizedSymptoms.includes('뇌졸중') ||
    normalizedSymptoms.includes('출혈') ||
    normalizedSymptoms.includes('실신')
  ) {
    return 'KTAS2';
  }

  if (
    normalizedSymptoms.includes('복통') ||
    normalizedSymptoms.includes('외상') ||
    normalizedSymptoms.includes('골절') ||
    normalizedSymptoms.includes('고열') ||
    normalizedSymptoms.includes('화상')
  ) {
    return 'KTAS3';
  }

  if (
    normalizedSymptoms.includes('발열') ||
    normalizedSymptoms.includes('두통') ||
    normalizedSymptoms.includes('구토') ||
    normalizedSymptoms.includes('어지')
  ) {
    return 'KTAS4';
  }

  return 'KTAS4';
}

function isSimpleHangoverSymptoms(symptoms: string) {
  const hasHangoverKeyword = containsAny(symptoms, '숙취', '과음', '음주', '술마시', '술마신', '술먹', '만취');
  if (!hasHangoverKeyword) {
    return false;
  }

  return !containsAny(
    symptoms,
    '의식',
    '의식저하',
    '경련',
    '쇼크',
    '심정지',
    '호흡없',
    '호흡 없음',
    '흉통',
    '가슴',
    '호흡곤란',
    '숨',
    '마비',
    '뇌졸중',
    '실신',
    '복통',
    '출혈',
    '토혈',
    '혈변',
    '검은변',
    '흑변',
  );
}

function inferHangoverSeverity(symptoms: string): Patient['severity'] {
  if (containsAny(symptoms, '두통', '구토', '메스꺼', '어지', '속쓰림', '갈증')) {
    return 'KTAS4';
  }
  return 'KTAS5';
}

function containsAny(source: string, ...keywords: string[]) {
  return keywords.some((keyword) => source.includes(keyword));
}
