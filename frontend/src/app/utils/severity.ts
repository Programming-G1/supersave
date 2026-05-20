import type { Patient } from '../types';

export interface SeverityKeywordInferenceResult {
  severityLevel: Patient['severity'];
  matched: boolean;
}

export function inferSeverityByKeywords(symptoms: string): SeverityKeywordInferenceResult {
  const normalizedSymptoms = symptoms.toLowerCase();

  if (
    normalizedSymptoms.includes('심정지') ||
    normalizedSymptoms.includes('의식') ||
    normalizedSymptoms.includes('경련') ||
    normalizedSymptoms.includes('쇼크')
  ) {
    return { severityLevel: 'KTAS1', matched: true };
  }

  if (
    normalizedSymptoms.includes('흉통') ||
    normalizedSymptoms.includes('흉부') ||
    normalizedSymptoms.includes('가슴') ||
    normalizedSymptoms.includes('호흡곤란') ||
    normalizedSymptoms.includes('숨') ||
    normalizedSymptoms.includes('마비') ||
    normalizedSymptoms.includes('뇌졸중') ||
    normalizedSymptoms.includes('출혈')
  ) {
    return { severityLevel: 'KTAS2', matched: true };
  }

  if (
    normalizedSymptoms.includes('복통') ||
    normalizedSymptoms.includes('외상') ||
    normalizedSymptoms.includes('골절') ||
    normalizedSymptoms.includes('고열')
  ) {
    return { severityLevel: 'KTAS3', matched: true };
  }

  if (
    normalizedSymptoms.includes('발열') ||
    normalizedSymptoms.includes('두통') ||
    normalizedSymptoms.includes('구토') ||
    normalizedSymptoms.includes('어지')
  ) {
    return { severityLevel: 'KTAS4', matched: true };
  }

  return { severityLevel: 'KTAS4', matched: false };
}

export function inferSeverityFromSymptoms(symptoms: string): Patient['severity'] {
  return inferSeverityByKeywords(symptoms).severityLevel;
}
