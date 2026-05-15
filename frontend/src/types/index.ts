export type SeverityLevel = 'KTAS1' | 'KTAS2' | 'KTAS3' | 'KTAS4' | 'KTAS5';
export type RequesterType = 'PARAMEDIC' | 'PATIENT' | 'GUARDIAN';
export type DepartureStatus = 'PENDING' | 'ACCEPTED' | 'CANCELLED';

export interface HospitalSummary {
  id: number;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  availableBeds: number;
  severityLevels: string[];
  availableSpecialists: string[];
  currentPatients: number;
  incomingPatients: number;
  estimatedWaitTimeMinutes: number;
  region: string;
}

export interface HospitalDetail extends HospitalSummary {
  departments: string[];
  equipmentStatus: string[];
  processingRatePerHour: number;
}

export interface RecommendationRequest {
  latitude: number;
  longitude: number;
  severityLevel: SeverityLevel;
  symptomSummary: string;
}

export interface RecommendationResult {
  hospitalId: number;
  hospitalName: string;
  score: number;
  distanceKm: number;
  etaMinutes: number;
  estimatedWaitMinutes: number;
  availableBeds: number;
  reason: string;
}

export interface DepartureRequest {
  hospitalId: number;
  userLatitude: number;
  userLongitude: number;
  etaMinutes?: number;
  patientName: string;
  requesterType: RequesterType;
  severityLevel: SeverityLevel;
  symptomSummary: string;
}

export interface DepartureResponse {
  registrationId: number;
  hospitalId: number;
  hospitalName: string;
  patientName: string;
  requesterType: RequesterType;
  etaMinutes: number;
  queuePosition: number;
  projectedWaitMinutes: number;
  advisory: string;
  createdAt: string;
}

export interface DepartureQueueItem {
  registrationId: number;
  hospitalId: number;
  hospitalName: string;
  patientName: string;
  requesterType: RequesterType;
  etaMinutes: number;
  severityLevel: SeverityLevel;
  symptomSummary: string;
  createdAt: string;
  status: DepartureStatus;
}

export interface AiGuideRequest {
  symptomText: string;
  severityLevel: SeverityLevel;
  userQuestion?: string;
}

export interface AiGuideResponse {
  safetyDisclaimer: string;
  summary: string;
  recommendationReason: string;
  actionGuide: string[];
  answer: string;
}

export interface AlertItem {
  id: string;
  level: 'NORMAL' | 'INFO' | 'WARNING';
  title: string;
  message: string;
  region: string;
  createdAt: string;
}
