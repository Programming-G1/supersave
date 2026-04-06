// 병원 정보 타입
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
  currentWaitTime: number; // 분 단위
  waitingPatients: number;
  arrivingPatients: number;
  equipment: {
    ct: boolean;
    mri: boolean;
    xray: boolean;
    ultrasound: boolean;
  };
  distance: number; // km
  estimatedTime: number; // 분
  congestionLevel: 'low' | 'medium' | 'high';
}

// 환자 정보 타입
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

// 이송 정보 타입
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

// AI 추천 타입
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

// 메시지 타입
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
