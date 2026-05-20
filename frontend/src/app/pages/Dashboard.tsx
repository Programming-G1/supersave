import React, { useState, useEffect } from 'react';
import { mockHospitals, mockPatient, congestionData, generateAIAnalysis } from '../data/mockData';
import { Hospital, HospitalRecommendation } from '../types';
import { fetchHospitals, fetchRecommendations, searchLocations } from '../../api';
import type { HospitalSummary, LocationSearchResult, RecommendationResult as ApiRecommendationResult } from '../../types';
import Map from '../components/Map';
import HospitalCard from '../components/HospitalCard';
import SymptomInput, { PatientSymptomData } from '../components/SymptomInput';
import { inferSeverityFromSymptoms } from '../utils/severity';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import {
  TrendingUp,
  Activity,
  AlertCircle,
  Filter,
  SortAsc,
  Award,
  Heart,
  Brain,
  Stethoscope,
  Sparkles,
  LocateFixed,
  MapPin,
  Search,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate, useLocation, useParams } from 'react-router';
import { useMode } from '../contexts/ModeContext';
import { toast } from 'sonner';

type DashboardTab = 'map' | 'analytics';
const DEFAULT_LOCATION = {
  name: '서울시청',
  coordinates: { lat: 37.5665, lng: 126.9780 },
};

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function hasSpecialty(hospital: HospitalSummary, keyword: string) {
  return hospital.availableSpecialists.some((specialist) => specialist.includes(keyword));
}

function toAppHospital(hospital: HospitalSummary): Hospital {
  const availableBeds = Math.max(0, hospital.availableBeds);
  const currentWaitTime = Math.max(0, hospital.estimatedWaitTimeMinutes);
  const departments = hospital.availableSpecialists.length > 0
    ? hospital.availableSpecialists
    : ['응급의학과'];
  const congestionLevel =
    currentWaitTime < 30
      ? 'low'
      : currentWaitTime < 60
        ? 'medium'
        : 'high';

  return {
    id: `h${hospital.id}`,
    name: hospital.name,
    address: hospital.address,
    coordinates: {
      lat: hospital.latitude,
      lng: hospital.longitude,
    },
    beds: {
      general: availableBeds,
      icu: Math.max(0, hospital.intensiveCareBeds ?? 0),
      surgery: Math.max(0, hospital.surgeryBeds ?? 0),
    },
    specialists: {
      cardiology: hasSpecialty(hospital, '심장') || hasSpecialty(hospital, '흉부'),
      neurology: hasSpecialty(hospital, '신경') || hasSpecialty(hospital, '뇌'),
      orthopedics: hasSpecialty(hospital, '정형') || hasSpecialty(hospital, '외상'),
      pediatrics: hasSpecialty(hospital, '소아'),
      trauma: hasSpecialty(hospital, '외상') || hasSpecialty(hospital, '응급'),
    },
    departments,
    currentWaitTime,
    waitingPatients: Math.max(0, hospital.currentPatients),
    arrivingPatients: Math.max(0, hospital.incomingPatients),
    equipment: {
      ct: false,
      mri: false,
      xray: false,
      ultrasound: false,
    },
    distance: 0,
    estimatedTime: 0,
    congestionLevel,
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userMode } = useParams<{ userMode: string }>();
  const { mode, setMode, isHydrated } = useMode();

  // URL의 모드와 Context의 모드 동기화
  useEffect(() => {
    console.log('Dashboard useEffect:', { isHydrated, userMode, mode });
    if (!isHydrated) return;

    if (userMode && (userMode === 'paramedic' || userMode === 'patient')) {
      if (userMode !== mode) {
        console.log('Setting mode from URL:', userMode);
        setMode(userMode as any);
      }
    } else if (!mode) {
      console.log('No mode found, redirecting to /');
      navigate('/');
    }
  }, [isHydrated, userMode, mode, setMode, navigate]);

  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'distance' | 'waitTime' | 'beds'>('distance');
  const [currentPatient, setCurrentPatient] = useState(mockPatient);
  const [patientForm, setPatientForm] = useState({
    name: mockPatient.name,
    age: mockPatient.age,
    gender: mockPatient.gender,
    symptoms: mockPatient.symptoms,
  });
  const [paramedicForm, setParamedicForm] = useState<PatientSymptomData>({
    name: mockPatient.name,
    age: mockPatient.age,
    gender: mockPatient.gender,
    symptoms: mockPatient.symptoms,
    severity: mockPatient.severity,
    bloodPressure: mockPatient.vitalSigns.bloodPressure,
    heartRate: mockPatient.vitalSigns.heartRate,
    temperature: mockPatient.vitalSigns.temperature,
    oxygenSaturation: mockPatient.vitalSigns.oxygenSaturation,
  });
  const [activeTab, setActiveTab] = useState<DashboardTab>('map');
  const [apiRecommendations, setApiRecommendations] = useState<ApiRecommendationResult[] | null>(null);
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
  const [hasRecommendationRequested, setHasRecommendationRequested] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [sourceHospitals, setSourceHospitals] = useState<Hospital[]>(mockHospitals);
  const [hospitalLoadError, setHospitalLoadError] = useState<string | null>(null);

  // 실제 사용자 위치 상태 (기본값: 서울시청)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>(DEFAULT_LOCATION.coordinates);
  const [locationLabel, setLocationLabel] = useState(DEFAULT_LOCATION.name);
  const [isLocating, setIsLocating] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationSearchResults, setLocationSearchResults] = useState<LocationSearchResult[]>([]);
  const [isLocationSearchLoading, setIsLocationSearchLoading] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState<string | null>(null);

  const resetRecommendationResult = () => {
    setSelectedHospitalId(null);
    setApiRecommendations(null);
    setHasRecommendationRequested(false);
    setRecommendationError(null);
  };

  const updatePatientForm = (nextForm: typeof patientForm) => {
    setPatientForm(nextForm);
    resetRecommendationResult();
  };

  const updateParamedicForm = (nextForm: PatientSymptomData) => {
    setParamedicForm(nextForm);
    resetRecommendationResult();
  };

  const applyLocation = (label: string, coordinates: { lat: number; lng: number }, showToast = true) => {
    setUserLocation(coordinates);
    setLocationLabel(label);
    resetRecommendationResult();
    if (showToast) {
      toast.success(`${label} 기준으로 위치를 설정했습니다`, {
        description: '거리, 이동시간, 추천 결과가 새 위치 기준으로 다시 계산됩니다.',
      });
    }
  };

  const requestCurrentLocation = (showToast = true) => {
    if (!navigator.geolocation) {
      toast.warning('현재 위치를 사용할 수 없습니다', {
        description: '브라우저가 위치 기능을 지원하지 않아 기본 위치를 사용합니다.',
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        applyLocation(
          '현재 위치',
          {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          showToast
        );
        setIsLocating(false);
      },
      (error) => {
        console.error('위치 정보를 가져오는데 실패했습니다:', error);
        setIsLocating(false);
        toast.warning('위치 권한이 거부되었거나 가져올 수 없습니다.', {
          description: `${DEFAULT_LOCATION.name} 기준으로 서비스를 제공합니다.`,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleLocationSearch = async (event: React.FormEvent) => {
    event.preventDefault();

    const query = locationSearchQuery.trim();
    if (!query) {
      toast.warning('검색할 위치를 입력해주세요');
      return;
    }

    setIsLocationSearchLoading(true);
    setLocationSearchError(null);

    try {
      const results = await searchLocations(query);
      setLocationSearchResults(results);
      if (results.length === 0) {
        setLocationSearchError('검색 결과가 없습니다. 장소명이나 주소를 조금 더 자세히 입력해주세요.');
      }
    } catch {
      setLocationSearchResults([]);
      setLocationSearchError('위치 검색에 실패했습니다. 카카오 REST API 키 설정을 확인해주세요.');
      toast.error('위치 검색에 실패했습니다', {
        description: '백엔드의 KAKAO_REST_API_KEY 설정을 확인해주세요.',
      });
    } finally {
      setIsLocationSearchLoading(false);
    }
  };

  const selectSearchedLocation = (result: LocationSearchResult) => {
    applyLocation(result.name, { lat: result.latitude, lng: result.longitude });
    setLocationSearchQuery(result.name);
    setLocationSearchResults([]);
    setLocationSearchError(null);
  };

  useEffect(() => {
    requestCurrentLocation(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadHospitals() {
      try {
        const hospitalList = await fetchHospitals();
        if (cancelled) {
          return;
        }
        const mappedHospitals = hospitalList
          .filter((hospital) => hospital.latitude && hospital.longitude)
          .map(toAppHospital);
        setSourceHospitals(mappedHospitals.length > 0 ? mappedHospitals : mockHospitals);
        setHospitalLoadError(null);
      } catch {
        if (!cancelled) {
          setSourceHospitals(mockHospitals);
          setHospitalLoadError('병원 API 호출에 실패해 로컬 mock 데이터를 표시합니다.');
          toast.error('병원 목록을 불러오지 못했습니다', {
            description: '임시로 로컬 병원 데이터를 표시합니다.',
          });
        }
      }
    }

    loadHospitals();
    return () => {
      cancelled = true;
    };
  }, []);

  // Haversine 거리 계산 함수
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // 지구 반경 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // 소수점 첫째자리까지 반올림
  };

  // 실시간 사용자 위치 및 교통상황 기반 병원 데이터 계산
  const hospitals = React.useMemo(() => {
    return sourceHospitals.map((hospital) => {
      if (!hospital.coordinates || !userLocation) return hospital;

      // 1. 직선거리 계산
      const straightDistance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        hospital.coordinates.lat,
        hospital.coordinates.lng
      );

      // 2. 실제 도로 주행 거리 추정 (직선 거리의 약 1.3배)
      const drivingDistance = Math.round(straightDistance * 1.3 * 10) / 10;

      // 3. 교통 상황 및 혼잡도 기반 이동 시간 추정
      // 현재 시간(시간대)에 따른 가중치 부여 (예: 출퇴근 시간 8~9시, 18~19시 정체)
      const currentHour = new Date().getHours();
      let trafficFactor = 1.0; // 기본 교통 상황 배율

      if ((currentHour >= 8 && currentHour <= 9) || (currentHour >= 18 && currentHour <= 19)) {
        trafficFactor = 1.6; // 출퇴근 시간 극심한 정체
      } else if (currentHour >= 7 && currentHour <= 20) {
        trafficFactor = 1.25; // 낮 시간 일반 정체
      } else {
        trafficFactor = 0.85; // 심야/새벽 원활
      }

      // 병원 주변 혼잡도에 따른 가중치 추가
      let congestionFactor = 1.0;
      if (hospital.congestionLevel === 'high') {
        congestionFactor = 1.3;
      } else if (hospital.congestionLevel === 'medium') {
        congestionFactor = 1.1;
      } else {
        congestionFactor = 0.9;
      }

      // 평균 시속 30km (1km당 2분) 기준 이동 시간 계산
      const baseTimePerKm = 2.0;
      const estimatedTime = Math.round(drivingDistance * baseTimePerKm * trafficFactor * congestionFactor);

      return {
        ...hospital,
        distance: drivingDistance,
        estimatedTime: Math.max(estimatedTime, 2), // 최소 2분 이상
      };
    });
  }, [sourceHospitals, userLocation]);

  // 증상 제출 핸들러
  const handleSymptomSubmit = async (data: PatientSymptomData) => {
    const nextPatient = {
      id: 'p1',
      name: data.name,
      age: data.age,
      gender: data.gender,
      symptoms: data.symptoms,
      severity: data.severity,
      vitalSigns: {
        bloodPressure: data.bloodPressure || '120/80',
        heartRate: data.heartRate || 80,
        temperature: data.temperature || 36.5,
        oxygenSaturation: data.oxygenSaturation || 98,
      },
    };

    setCurrentPatient(nextPatient);
    setIsRecommendationLoading(true);
    setHasRecommendationRequested(true);
    setRecommendationError(null);

    try {
      const results = await fetchRecommendations({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        severityLevel: data.severity,
        symptomSummary: data.symptoms,
      });

      setApiRecommendations(results);
      const topRecommendation = results[0];
      if (topRecommendation) {
        setSelectedHospitalId(`h${topRecommendation.hospitalId}`);
      }
      toast.success('AI 추천 결과가 업데이트되었습니다', {
        description: results[0]
          ? `${results[0].hospitalName}을(를) 우선 추천합니다`
          : '추천 가능한 병원을 찾지 못했습니다',
      });
    } catch {
      setApiRecommendations(null);
      setRecommendationError('추천 API 호출에 실패해 로컬 mock 추천을 표시합니다.');
      toast.error('추천 API 호출에 실패했습니다', {
        description: '백엔드 서버 상태를 확인해주세요. 임시로 로컬 추천 결과를 표시합니다.',
      });
    } finally {
      setIsRecommendationLoading(false);
    }

  };

  const handleRecommendationSubmit = async () => {
    const symptomData: PatientSymptomData =
      mode === 'patient'
        ? {
            name: patientForm.name.trim() || '환자',
            age: patientForm.age,
            gender: patientForm.gender,
            symptoms: patientForm.symptoms.trim(),
            severity: inferSeverityFromSymptoms(patientForm.symptoms),
            bloodPressure: currentPatient.vitalSigns.bloodPressure,
            heartRate: currentPatient.vitalSigns.heartRate,
            temperature: currentPatient.vitalSigns.temperature,
            oxygenSaturation: currentPatient.vitalSigns.oxygenSaturation,
          }
        : {
            ...paramedicForm,
            name: paramedicForm.name.trim() || '환자',
            symptoms: paramedicForm.symptoms.trim(),
          };

    if (!symptomData.symptoms.trim()) {
      toast.warning('증상을 입력해주세요', {
        description: 'AI가 중증도와 병원 추천을 판단하려면 현재 증상 정보가 필요합니다.',
      });
      return;
    }

    await handleSymptomSubmit(symptomData);

    if (mode === 'patient') {
      toast.info(`AI 판단 중증도: ${symptomData.severity}`, {
        description: '환자모드에서는 중증도를 직접 선택하지 않고 증상 기반으로 자동 판단합니다.',
      });
    } else {
      toast.info(`입력 중증도: ${symptomData.severity}`, {
        description: '구급대원모드는 입력한 KTAS와 출발 위치를 함께 반영합니다.',
      });
    }
  };

  // 병원 추천 점수 계산
  const calculateRecommendations = (): HospitalRecommendation[] => {
    return hospitals.map((hospital) => {
      const distanceScore = Math.max(0, 100 - hospital.distance * 10);
      const availabilityScore = (hospital.beds.general + hospital.beds.icu * 2 + hospital.beds.surgery * 1.5) * 3;

      // 증상에 따른 전문성 점수
      let specializationScore = 50;
      if (currentPatient.symptoms.includes('흉') || currentPatient.symptoms.includes('심장')) {
        specializationScore = hospital.specialists.cardiology ? 90 : 40;
      } else if (currentPatient.symptoms.includes('뇌') || currentPatient.symptoms.includes('신경')) {
        specializationScore = hospital.specialists.neurology ? 90 : 40;
      } else if (currentPatient.symptoms.includes('골절') || currentPatient.symptoms.includes('정형')) {
        specializationScore = hospital.specialists.orthopedics ? 90 : 40;
      } else if (currentPatient.symptoms.includes('외상') || currentPatient.symptoms.includes('사고')) {
        specializationScore = hospital.specialists.trauma ? 95 : 35;
      }

      const totalEstimatedMinutes = hospital.estimatedTime + hospital.currentWaitTime;
      const waitTimeScore = Math.max(0, 100 - totalEstimatedMinutes);

      const totalScore =
        distanceScore * 0.3 +
        availabilityScore * 0.3 +
        specializationScore * 0.2 +
        waitTimeScore * 0.2;

      return {
        hospital,
        score: clampScore(totalScore),
        reasons: {
          distance: distanceScore,
          availability: availabilityScore,
          specialization: specializationScore,
          waitTime: waitTimeScore,
        },
        aiAnalysis: generateAIAnalysis(hospital, currentPatient),
      };
    }).sort((a, b) => b.score - a.score);
  };

  const mapApiRecommendation = (recommendation: ApiRecommendationResult): HospitalRecommendation => {
    const baseHospital =
      hospitals.find((item) => item.id === `h${recommendation.hospitalId}`) ??
      hospitals[0];

    const score = clampScore(recommendation.score);
    const totalEstimatedMinutes = recommendation.totalEstimatedMinutes ?? recommendation.etaMinutes + recommendation.estimatedWaitMinutes;
    const waitScore = Math.max(0, 100 - totalEstimatedMinutes);
    const distanceScore = Math.max(0, 100 - recommendation.distanceKm * 10);
    const availabilityScore = Math.min(100, recommendation.availableBeds * 6);
    const congestionLevel =
      recommendation.estimatedWaitMinutes < 30
        ? 'low'
        : recommendation.estimatedWaitMinutes < 60
          ? 'medium'
          : 'high';

    return {
      hospital: {
        ...baseHospital,
        id: `h${recommendation.hospitalId}`,
        name: recommendation.hospitalName,
        distance: recommendation.distanceKm,
        estimatedTime: recommendation.etaMinutes,
        currentWaitTime: recommendation.estimatedWaitMinutes,
        beds: {
          ...baseHospital.beds,
          general: recommendation.availableBeds,
          icu: Math.max(0, recommendation.intensiveCareBeds ?? baseHospital.beds.icu),
          surgery: Math.max(0, recommendation.surgeryBeds ?? baseHospital.beds.surgery),
        },
        congestionLevel,
      },
      score,
      reasons: {
        distance: distanceScore,
        availability: availabilityScore,
        specialization: score,
        waitTime: waitScore,
      },
      aiAnalysis: `[실제 추천 API 결과]\n\n${recommendation.hospitalName} 추천 근거:\n${recommendation.reason}\n\n점수: ${recommendation.score}/100\n거리: ${recommendation.distanceKm}km\n예상 이동: ${recommendation.etaMinutes}분\n예상 대기: ${recommendation.estimatedWaitMinutes}분\n총 소요: ${totalEstimatedMinutes}분\n가용 병상: ${recommendation.availableBeds}개`,
    };
  };

  const recommendations = apiRecommendations
    ? apiRecommendations.map(mapApiRecommendation)
    : calculateRecommendations();

  // 필터링 및 정렬
  const filteredHospitals = hospitals
    .filter((hospital) => {
      if (searchQuery && !hospital.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filterDepartment && !hospital.departments.includes(filterDepartment)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return a.distance - b.distance;
        case 'waitTime':
          return (a.estimatedTime + a.currentWaitTime) - (b.estimatedTime + b.currentWaitTime);
        case 'beds':
          const bedsA = a.beds.general + a.beds.icu + a.beds.surgery;
          const bedsB = b.beds.general + b.beds.icu + b.beds.surgery;
          return bedsB - bedsA;
        default:
          return 0;
      }
    });

  const allDepartments = Array.from(new Set(hospitals.flatMap((h) => h.departments)));

  // 전체 통계
  const totalBeds = hospitals.reduce(
    (sum, h) => sum + h.beds.general + h.beds.icu + h.beds.surgery,
    0
  );
  const totalWaiting = hospitals.reduce((sum, h) => sum + h.waitingPatients, 0);
  const avgWaitTime = hospitals.length > 0
    ? Math.round(hospitals.reduce((sum, h) => sum + h.currentWaitTime, 0) / hospitals.length)
    : 0;
  const fastestHospital = hospitals.reduce<Hospital | null>((best, hospital) => {
    if (!best || hospital.estimatedTime + hospital.currentWaitTime < best.estimatedTime + best.currentWaitTime) {
      return hospital;
    }
    return best;
  }, null);
  const fastestTotalTime = fastestHospital ? fastestHospital.estimatedTime + fastestHospital.currentWaitTime : 0;
  const crowdedHospital = hospitals.find((hospital) => hospital.congestionLevel === 'high');

  const handleSelectHospital = (hospitalId: string) => {
    const selectedHospital = hospitals.find((hospital) => hospital.id === hospitalId)
      ?? recommendations.find((recommendation) => recommendation.hospital.id === hospitalId)?.hospital;

    navigate('/transfer', {
      state: {
        selectedHospitalId: hospitalId,
        selectedHospital,
        patientData: currentPatient,
        userLocation,
      },
    });
  };

  const activeSymptoms = mode === 'patient' ? patientForm.symptoms : paramedicForm.symptoms;
  const recommendationSeverityLabel =
    mode === 'patient'
      ? `AI 판단 예상: ${activeSymptoms.trim() ? inferSeverityFromSymptoms(activeSymptoms) : '-'}`
      : `입력 중증도: ${paramedicForm.severity}`;

  if (!isHydrated) return null;

  return (
    <div className="space-y-6">
      {/* 증상 입력 섹션 */}
      {mode === 'patient' && (
        <Card className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI 맞춤 병원 추천</h3>
                  <p className="text-sm text-gray-600">
                    환자 정보와 증상만 입력하면 AI가 중증도를 판단하고 병원을 추천합니다.
                  </p>
                  <p className="mt-1 text-xs text-blue-700">
                    환자모드에서는 KTAS를 직접 선택하지 않습니다.
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="w-fit border-blue-200 bg-white text-blue-700">
                AI 중증도 자동 판단
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="patient-name" className="mb-1 block text-sm font-medium text-gray-700">
                  환자명 *
                </label>
                <Input
                  id="patient-name"
                  value={patientForm.name}
                  onChange={(e) => updatePatientForm({ ...patientForm, name: e.target.value })}
                  placeholder="예: 김환자"
                  required
                />
              </div>

              <div>
                <label htmlFor="patient-age" className="mb-1 block text-sm font-medium text-gray-700">
                  나이 *
                </label>
                <Input
                  id="patient-age"
                  type="number"
                  min="0"
                  max="120"
                  value={patientForm.age}
                  onChange={(e) => updatePatientForm({ ...patientForm, age: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div>
                <label htmlFor="patient-gender" className="mb-1 block text-sm font-medium text-gray-700">
                  성별 *
                </label>
                <select
                  id="patient-gender"
                  value={patientForm.gender}
                  onChange={(e) => updatePatientForm({ ...patientForm, gender: e.target.value as 'male' | 'female' })}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                >
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="patient-symptoms" className="mb-1 block text-sm font-medium text-gray-700">
                현재 증상 *
              </label>
              <textarea
                id="patient-symptoms"
                value={patientForm.symptoms}
                onChange={(e) => updatePatientForm({ ...patientForm, symptoms: e.target.value })}
                className="min-h-[96px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="예: 흉부 통증과 호흡곤란이 있어요"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                입력된 증상으로 KTAS를 자동 판단해 추천 API에 전달합니다.
              </p>
            </div>

          </div>
        </Card>
      )}

      {mode === 'paramedic' && (
        <SymptomInput
          onSubmit={handleSymptomSubmit}
          isSubmitting={isRecommendationLoading}
          initialData={paramedicForm}
          hideSubmit
          onChange={updateParamedicForm}
        />
      )}

      {/* 출발 위치 설정 */}
      <Card className="p-4 border-blue-100 bg-white">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">출발 위치 설정</h3>
              <p className="text-sm text-gray-600">
                현재 기준: <span className="font-semibold text-blue-700">{locationLabel}</span>
                <span className="ml-2 text-xs text-gray-400">
                  {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                위치를 바꾸면 거리, 이동시간, 총 소요시간 기준 추천이 다시 계산됩니다.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <form onSubmit={handleLocationSearch} className="flex flex-1 flex-col gap-2 sm:flex-row">
              <Input
                value={locationSearchQuery}
                onChange={(event) => setLocationSearchQuery(event.target.value)}
                placeholder="출발 위치 검색 예: 단국대, 서울역"
                className="flex-1"
              />
              <Button
                type="submit"
                variant="outline"
                disabled={isLocationSearchLoading}
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Search className="h-4 w-4" />
                {isLocationSearchLoading ? '검색 중' : '위치 검색'}
              </Button>
            </form>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => requestCurrentLocation(true)}
              disabled={isLocating}
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <LocateFixed className="h-4 w-4" />
              {isLocating ? '확인 중' : '현재 위치'}
            </Button>
          </div>

          {(locationSearchResults.length > 0 || locationSearchError) && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              {locationSearchError ? (
                <p className="text-sm text-gray-600">{locationSearchError}</p>
              ) : (
                <div className="space-y-2">
                  {locationSearchResults.map((result) => (
                    <button
                      key={`${result.name}-${result.latitude}-${result.longitude}`}
                      type="button"
                      onClick={() => selectSearchedLocation(result)}
                      className="w-full rounded-lg bg-white p-3 text-left transition hover:bg-blue-50"
                    >
                      <p className="font-medium text-gray-900">{result.name}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {result.roadAddress || result.address || '주소 정보 없음'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {(mode === 'patient' || mode === 'paramedic') && (
        <Card className="p-4 border-blue-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-semibold">증상과 출발 위치 기준으로 추천받기</h3>
              <p className="mt-1 text-sm text-blue-50">
                현재 위치 기준: {locationLabel} / 증상: {activeSymptoms || '입력 필요'}
              </p>
              <p className="mt-1 text-xs text-blue-100">{recommendationSeverityLabel}</p>
            </div>
            <Button
              type="button"
              onClick={handleRecommendationSubmit}
              disabled={isRecommendationLoading || !activeSymptoms.trim()}
              className="bg-white text-blue-700 hover:bg-blue-50"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isRecommendationLoading ? 'AI 추천 계산 중...' : 'AI 병원 추천 받기'}
            </Button>
          </div>
        </Card>
      )}

      {hasRecommendationRequested && (
        <Card className="p-5 border-blue-100 bg-white">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">추천 결과 TOP 3</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {currentPatient.name} ({currentPatient.age}세, {currentPatient.gender === 'male' ? '남' : '여'}) / {currentPatient.symptoms}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge className="bg-red-600">AI 판단 중증도: {currentPatient.severity}</Badge>
                  {apiRecommendations && (
                    <Badge variant="outline" className="border-blue-200 text-blue-700">
                      백엔드 추천 API 연동
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveTab('map')}
              className="text-blue-600"
            >
              지도에서 확인
            </Button>
          </div>

          {recommendationError && (
            <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              {recommendationError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {recommendations.slice(0, 3).map((rec, index) => (
              <Card key={rec.hospital.id} className="relative p-4">
                <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
                  <span className="text-xs font-bold text-white">{index + 1}</span>
                </div>

                <h4 className="mb-2 pr-7 font-semibold text-gray-900">{rec.hospital.name}</h4>

                <div className="mb-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-gray-500">적합도 점수</span>
                    <span className="text-sm font-bold text-blue-600">{rec.score}/100</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all"
                      style={{ width: `${rec.score}%` }}
                    />
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-3 gap-2 rounded-lg bg-blue-50 p-3 text-center text-xs">
                  <div>
                    <p className="text-gray-500">이동</p>
                    <p className="font-semibold text-gray-900">{rec.hospital.estimatedTime}분</p>
                  </div>
                  <div>
                    <p className="text-gray-500">대기</p>
                    <p className="font-semibold text-gray-900">{rec.hospital.currentWaitTime}분</p>
                  </div>
                  <div>
                    <p className="text-gray-500">총 소요</p>
                    <p className="font-semibold text-gray-900">
                      {rec.hospital.estimatedTime + rec.hospital.currentWaitTime}분
                    </p>
                  </div>
                </div>

                <p className="mb-3 text-xs text-gray-500">
                  거리 {rec.hospital.distance}km / 가용 병상 {rec.hospital.beds.general}개
                </p>

                <details className="mb-3">
                  <summary className="cursor-pointer text-xs text-blue-600 hover:underline">
                    추천 근거 보기
                  </summary>
                  <div className="mt-2 rounded-lg bg-gray-50 p-3">
                    <p className="whitespace-pre-line text-xs text-gray-700">{rec.aiAnalysis}</p>
                  </div>
                </details>

                <Button
                  onClick={() => handleSelectHospital(rec.hospital.id)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  이 병원 선택
                </Button>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* 상단 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">전체 가용 병상</p>
              <p className="text-2xl font-bold text-gray-900">{totalBeds}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>실시간 업데이트</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">대기 환자</p>
              <p className="text-2xl font-bold text-gray-900">{totalWaiting}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
              <Stethoscope className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">평균 대기: {avgWaitTime}분</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">운영 중인 병원</p>
              <p className="text-2xl font-bold text-gray-900">{hospitals.length}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">24시간 운영</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">최단 총 소요시간</p>
              <p className="text-2xl font-bold text-gray-900">
                {fastestTotalTime}분
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
              <Brain className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {fastestHospital ? `${fastestHospital.name} · 이동 ${fastestHospital.estimatedTime}분 + 대기 ${fastestHospital.currentWaitTime}분` : '정보 없음'}
          </p>
        </Card>
      </div>

      {hospitalLoadError && (
        <Card className="border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          {hospitalLoadError}
        </Card>
      )}

      {/* 긴급 알림 */}
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900">긴급 알림</h4>
            <p className="text-sm text-yellow-800 mt-1">
              {crowdedHospital
                ? `${crowdedHospital.name}의 혼잡도가 높습니다. 거리순 또는 총 소요시간순으로 인근 대체 병원을 확인하세요.`
                : '전국 응급의료기관 정보를 기준으로 병원 현황을 표시합니다.'}
            </p>
          </div>
        </div>
      </Card>

      {/* 메인 컨텐츠 탭 */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DashboardTab)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="map">지도 뷰</TabsTrigger>
          <TabsTrigger value="analytics">대기시간 분석</TabsTrigger>
        </TabsList>

        {/* 지도 뷰 탭 */}
        <TabsContent value="map" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 지도 */}
            <div className="lg:col-span-2">
              <Map
                hospitals={filteredHospitals}
                selectedHospitalId={selectedHospitalId || undefined}
                onHospitalClick={setSelectedHospitalId}
                userLocation={userLocation}
              />
            </div>

            {/* 병원 리스트 */}
            <div className="space-y-4">
              {/* 필터 및 검색 */}
              <Card className="p-4 space-y-3">
                <Input
                  placeholder="병원 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={filterDepartment || ''}
                    onChange={(e) => setFilterDepartment(e.target.value || null)}
                    className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">전체 진료과</option>
                    {allDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <SortAsc className="w-4 h-4 text-gray-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="distance">거리순</option>
                    <option value="waitTime">총 소요시간순</option>
                    <option value="beds">가용병상순</option>
                  </select>
                </div>
              </Card>

              {/* 병원 리스트 */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {filteredHospitals.map((hospital) => (
                  <div
                    key={hospital.id}
                    onClick={() => setSelectedHospitalId(hospital.id)}
                    className={`cursor-pointer transition-all ${selectedHospitalId === hospital.id ? 'ring-2 ring-blue-500 rounded-lg' : ''
                      }`}
                  >
                    <HospitalCard hospital={hospital} showActions={false} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 대기시간 분석 탭 */}
        <TabsContent value="analytics" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">시간대별 평균 대기 환자 수</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={congestionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="patients"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-500 mt-4">
              * 피크 시간대: 18:00-20:00 / 최저 시간대: 04:00-06:00
            </p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hospitals.map((hospital) => {
              const estimatedWait = hospital.currentWaitTime + (hospital.arrivingPatients * 5);
              return (
                <Card key={hospital.id} className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">{hospital.name}</h4>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">현재 대기 시간</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {hospital.currentWaitTime}분
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${hospital.currentWaitTime < 30
                            ? 'bg-green-500'
                            : hospital.currentWaitTime < 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                            }`}
                          style={{ width: `${Math.min(hospital.currentWaitTime, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">대기 중</span>
                      <span className="font-semibold text-gray-900">{hospital.waitingPatients}명</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">도착 예정</span>
                      <span className="font-semibold text-gray-900">{hospital.arrivingPatients}명</span>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">예상 대기 시간</span>
                        <span className="font-bold text-blue-600">{estimatedWait}분</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
