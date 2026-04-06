export interface Hospital {
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  beds: {
    general: number;
    icu: number;
    surgery: number;
  };
  specialists: {
    cardiology: boolean;
    neurology: boolean;
    orthopedics: boolean;
    pediatrics: boolean;
    trauma: boolean;
  };
  departments: string[];
  currentWaitTime: number;
  waitingPatients: number;
  arrivingPatients: number;
  equipment: {
    ct: boolean;
    mri: boolean;
    xray: boolean;
    ultrasound: boolean;
  };
  distance: number;
  estimatedTime: number;
  congestionLevel: 'low' | 'medium' | 'high';
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  symptoms: string;
  severity: 'KTAS1' | 'KTAS2' | 'KTAS3' | 'KTAS4' | 'KTAS5';
  vitalSigns: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    oxygenSaturation: number;
  };
}

export interface Transfer {
  id: string;
  patientId: string;
  hospitalId: string;
  status: 'pending' | 'in_progress' | 'arrived' | 'completed';
  departureTime?: Date;
  estimatedArrival?: Date;
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

export interface HospitalRecommendation {
  hospital: Hospital;
  score: number;
  reasons: {
    distance: number;
    availability: number;
    specialization: number;
    waitTime: number;
  };
  aiAnalysis: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface CongestionPoint {
  time: string;
  patients: number;
}

export interface ArrivingPatient {
  id: string;
  hospitalId: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  severity: Patient['severity'];
  symptoms: string;
  eta: number;
  paramedic: string;
  registeredAt: string;
  status: 'pending' | 'accepted' | 'cancelled';
}

export interface AppDataResponse {
  hospitals: Hospital[];
  patientTemplate: Patient;
  congestionData: CongestionPoint[];
}

export interface TransferResponse {
  transferId: string;
  hospitalId: string;
  hospitalName: string;
  estimatedTime: number;
  status: string;
  message: string;
  arrival: ArrivingPatient;
}
