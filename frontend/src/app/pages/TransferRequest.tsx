import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { useMode } from '../contexts/ModeContext';

import { fetchHospitals, registerDeparture, resolveSeverityLevel } from '../../api';
import type { HospitalSummary } from '../../types';

import { mockHospitals, mockPatient } from '../data/mockData';
import type { Hospital } from '../types';
import { inferSeverityFromSymptoms } from '../utils/severity';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import HospitalCard from '../components/HospitalCard';
import {
  Send,
  CheckCircle,
  Navigation,
  Clock,
  AlertCircle,
  MapPin,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';

function hasSpecialty(hospital: HospitalSummary, keyword: string) {
  return hospital.availableSpecialists.some((specialist) => specialist.includes(keyword));
}

function toAppHospital(hospital: HospitalSummary): Hospital {
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
    coordinates: { lat: hospital.latitude, lng: hospital.longitude },
    beds: {
      general: Math.max(0, hospital.availableBeds),
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
    equipment: { ct: false, mri: false, xray: false, ultrasound: false },
    distance: 0,
    estimatedTime: Math.max(8, Math.round(currentWaitTime / 4)),
    congestionLevel,
  };
}

export default function TransferRequest() {
  const hospitalManagerSelectionKey = 'hospitalManager:selectedHospitalId';
  const location = useLocation();
  const navigate = useNavigate();
  const { mode } = useMode();
  const navigationPatientData = location.state?.patientData;
  const navigationHospital = location.state?.selectedHospital as Hospital | undefined;
  const requestLocation = location.state?.userLocation ?? { lat: 37.5665, lng: 126.9780 };
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(
    location.state?.selectedHospitalId || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferStarted, setTransferStarted] = useState(false);
  const [eta, setEta] = useState<number>(0);
  const [initialEta, setInitialEta] = useState<number | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>(
    navigationHospital
      ? [navigationHospital, ...mockHospitals.filter((hospital) => hospital.id !== navigationHospital.id)]
      : mockHospitals
  );

  // 환자 정보 폼 상태
  const [patientData, setPatientData] = useState({
    name: navigationPatientData?.name ?? mockPatient.name,
    age: navigationPatientData?.age ?? mockPatient.age,
    gender: navigationPatientData?.gender ?? mockPatient.gender,
    symptoms: navigationPatientData?.symptoms ?? mockPatient.symptoms,
    severity: navigationPatientData?.severity ?? mockPatient.severity,
    bloodPressure: navigationPatientData?.vitalSigns?.bloodPressure ?? mockPatient.vitalSigns.bloodPressure,
    heartRate: navigationPatientData?.vitalSigns?.heartRate ?? mockPatient.vitalSigns.heartRate,
    temperature: navigationPatientData?.vitalSigns?.temperature ?? mockPatient.vitalSigns.temperature,
    oxygenSaturation: navigationPatientData?.vitalSigns?.oxygenSaturation ?? mockPatient.vitalSigns.oxygenSaturation,
  });

  const selectedHospital = hospitals.find((h) => h.id === selectedHospitalId);
  const displaySeverity = mode === 'patient'
    ? inferSeverityFromSymptoms(patientData.symptoms)
    : patientData.severity;
  const hasPrefilledTransfer = Boolean(navigationPatientData);
  const expectedMoveMinutes = selectedHospital?.estimatedTime ?? 0;
  const expectedWaitMinutes = selectedHospital?.currentWaitTime ?? 0;
  const expectedTotalMinutes = expectedMoveMinutes + expectedWaitMinutes;

  const resolveBackendHospitalId = (hospitalId: string | null) => {
    if (!hospitalId) return null;
    const match = hospitalId.match(/\d+/);
    return match ? Number(match[0]) : null;
  };

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
        const nextHospitals = mappedHospitals.length > 0 ? mappedHospitals : mockHospitals;
        setHospitals(
          navigationHospital
            ? [
                navigationHospital,
                ...nextHospitals.filter((hospital) => hospital.id !== navigationHospital.id),
              ]
            : nextHospitals
        );
      } catch {
        if (!cancelled) {
          setHospitals(
            navigationHospital
              ? [navigationHospital, ...mockHospitals.filter((hospital) => hospital.id !== navigationHospital.id)]
              : mockHospitals
          );
        }
      }
    }

    loadHospitals();
    return () => {
      cancelled = true;
    };
  }, [navigationHospital]);

  useEffect(() => {
    if (transferStarted && selectedHospital) {
      const startingEta = initialEta ?? selectedHospital.estimatedTime;
      setEta(startingEta);
      const interval = setInterval(() => {
        setEta((prev) => {
          if (prev <= 0) {
            clearInterval(interval);
            toast.success('병원에 도착했습니다!');
            return 0;
          }
          return prev - 1;
        });
      }, 60000); // 1분마다 업데이트

      return () => clearInterval(interval);
    }
  }, [transferStarted, selectedHospital, initialEta]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedHospitalId) {
      toast.error('이송할 병원을 선택해주세요.');
      return;
    }

    const backendHospitalId = resolveBackendHospitalId(selectedHospitalId);
    if (!backendHospitalId) {
      toast.error('병원 ID를 확인할 수 없습니다.');
      return;
    }

    setIsSubmitting(true);
    const severityResult = mode === 'patient'
      ? await resolveSeverityLevel({
          symptomText: patientData.symptoms,
          age: patientData.age,
          bloodPressure: patientData.bloodPressure,
          heartRate: patientData.heartRate,
          temperature: patientData.temperature,
          oxygenSaturation: patientData.oxygenSaturation,
        })
      : { severityLevel: patientData.severity, source: 'MANUAL' as const };
    const severityLevel = severityResult.severityLevel;
    setPatientData((prev) => ({ ...prev, severity: severityLevel }));

    try {
      const response = await registerDeparture({
        hospitalId: backendHospitalId,
        userLatitude: requestLocation.lat,
        userLongitude: requestLocation.lng,
        etaMinutes: selectedHospital?.estimatedTime,
        patientName: patientData.name,
        requesterType: mode === 'patient' ? 'PATIENT' : 'PARAMEDIC',
        severityLevel,
        symptomSummary: patientData.symptoms,
      });

      window.localStorage.setItem(hospitalManagerSelectionKey, String(response.hospitalId));
      setInitialEta(response.etaMinutes);
      setIsSubmitting(false);
      setTransferStarted(true);
      if (mode === 'patient' && severityResult.source !== 'MANUAL') {
        const severityDescription =
          severityResult.source === 'AI'
            ? '키워드가 부족해 AI가 증상 설명을 보완 해석했습니다.'
            : severityResult.source === 'FALLBACK'
              ? 'AI 응답이 없어 보수적 fallback 기준으로 중증도를 분류했습니다.'
              : '증상 키워드가 일치해 자동 판단했습니다.';
        toast.info(`AI 판단 중증도: ${severityLevel}`, {
          description: severityDescription,
        });
      }
      toast.success('이송이 시작되었습니다!', {
        description: `${selectedHospital?.name}에 도착 예정 요청이 등록되었습니다.`,
      });
    } catch {
      setIsSubmitting(false);
      toast.error('이송 요청 등록에 실패했습니다.');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'KTAS1':
        return 'bg-red-600';
      case 'KTAS2':
        return 'bg-orange-500';
      case 'KTAS3':
        return 'bg-yellow-500';
      case 'KTAS4':
        return 'bg-green-500';
      case 'KTAS5':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (transferStarted && selectedHospital) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 이송 진행 상태 */}
        <Card className="p-8 text-center bg-gradient-to-br from-green-50 to-blue-50">
          <div className="flex items-center justify-center w-20 h-20 bg-green-600 rounded-full mx-auto mb-6 animate-pulse">
            <Navigation className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">이송 진행 중</h2>
          <p className="text-gray-600 mb-6">병원으로 이동 중입니다</p>

          <div className="max-w-md mx-auto mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">진행 상황</span>
              <span className="text-sm font-semibold text-gray-900">
                {(initialEta ?? selectedHospital.estimatedTime) - eta} / {initialEta ?? selectedHospital.estimatedTime}분
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-1000"
                style={{
                  width: `${(((initialEta ?? selectedHospital.estimatedTime) - eta) / (initialEta ?? selectedHospital.estimatedTime)) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">목적지</p>
              <p className="font-semibold text-gray-900">{selectedHospital.name}</p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow-sm">
              <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">도착 예정</p>
              <p className="font-semibold text-gray-900 text-xl">{eta}분</p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow-sm">
              <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">거리</p>
              <p className="font-semibold text-gray-900">{selectedHospital.distance}km</p>
            </div>
          </div>
        </Card>

        {/* 병원 정보 */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">목적지 병원 정보</h3>
          <HospitalCard hospital={selectedHospital} showActions={false} />
        </Card>

        {/* 환자 정보 */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">환자 정보</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">환자명</p>
              <p className="font-semibold text-gray-900">{patientData.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">나이</p>
              <p className="font-semibold text-gray-900">{patientData.age}세</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">성별</p>
              <p className="font-semibold text-gray-900">
                {patientData.gender === 'male' ? '남성' : '여성'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">중증도</p>
              <Badge className={getSeverityColor(displaySeverity)}>{displaySeverity}</Badge>
            </div>
          </div>
        </Card>

        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => setTransferStarted(false)}>
            이송 취소
          </Button>
          <Button onClick={() => navigate(mode ? `/dashboard/${mode}` : '/')} className="bg-blue-600 hover:bg-blue-700">
            대시보드로
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">응급 이송 요청</h1>
          <p className="text-gray-600 mt-1">환자 정보를 입력하고 이송할 병원을 선택하세요</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {hasPrefilledTransfer ? (
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6">
            <Card className="p-6 border-blue-100 bg-blue-50/40">
              <div className="mb-5 flex items-center gap-2 text-blue-700">
                <CheckCircle className="w-5 h-5" />
                <h3 className="font-semibold">추천 입력 정보 확인</h3>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="text-xs font-medium text-gray-500">환자</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">{patientData.name}</span>
                    <Badge variant="outline">{patientData.age}세</Badge>
                    <Badge variant="outline">{patientData.gender === 'male' ? '남성' : '여성'}</Badge>
                    <Badge className={getSeverityColor(displaySeverity)}>{displaySeverity}</Badge>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500">주요 증상</p>
                  <p className="mt-2 rounded-lg bg-white p-3 text-sm text-gray-800">
                    {patientData.symptoms}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500">활력 징후</p>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs text-gray-500">혈압</p>
                      <p className="font-semibold text-gray-900">{patientData.bloodPressure}</p>
                    </div>
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs text-gray-500">심박수</p>
                      <p className="font-semibold text-gray-900">{patientData.heartRate} bpm</p>
                    </div>
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs text-gray-500">체온</p>
                      <p className="font-semibold text-gray-900">{patientData.temperature}°C</p>
                    </div>
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs text-gray-500">산소포화도</p>
                      <p className="font-semibold text-gray-900">{patientData.oxygenSaturation}%</p>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(mode ? `/dashboard/${mode}` : '/')}
                  className="w-full bg-white"
                >
                  증상/위치 다시 설정
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">선택 병원 및 예상 소요시간</h3>

              {selectedHospital ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="mb-2 flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-semibold">병원이 선택되었습니다</span>
                        </div>
                        <h4 className="text-2xl font-bold text-gray-900">{selectedHospital.name}</h4>
                        <p className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {selectedHospital.address}
                        </p>
                      </div>
                      <Badge className={
                        selectedHospital.congestionLevel === 'low'
                          ? 'bg-green-100 text-green-700'
                          : selectedHospital.congestionLevel === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      }>
                        {selectedHospital.congestionLevel === 'low'
                          ? '원활'
                          : selectedHospital.congestionLevel === 'medium'
                            ? '보통'
                            : '혼잡'}
                      </Badge>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-5 text-white">
                    <p className="text-sm text-blue-100">총 소요시간 예상</p>
                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-4xl font-bold">{expectedTotalMinutes}</span>
                      <span className="mb-1 text-lg">분</span>
                    </div>
                    <p className="mt-2 text-sm text-blue-50">
                      이동 {expectedMoveMinutes}분 + 병원 예상 대기 {expectedWaitMinutes}분 기준
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs text-gray-500">이동 시간</p>
                      <p className="mt-1 font-bold text-gray-900">{expectedMoveMinutes}분</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs text-gray-500">예상 대기</p>
                      <p className="mt-1 font-bold text-gray-900">{expectedWaitMinutes}분</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs text-gray-500">거리</p>
                      <p className="mt-1 font-bold text-gray-900">{selectedHospital.distance}km</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs text-gray-500">가용 병상</p>
                      <p className="mt-1 font-bold text-gray-900">{selectedHospital.beds.general}개</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">병상 현황</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">일반</p>
                        <p className="font-semibold text-gray-900">{selectedHospital.beds.general}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">중환자</p>
                        <p className="font-semibold text-gray-900">{selectedHospital.beds.icu}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">수술실</p>
                        <p className="font-semibold text-gray-900">{selectedHospital.beds.surgery}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">진료 가능 과목</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedHospital.departments.slice(0, 6).map((department) => (
                        <Badge key={department} variant="outline">{department}</Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedHospitalId(null)}
                    className="w-full"
                  >
                    다른 병원 선택
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-8">
                    <AlertCircle className="w-10 h-10 text-gray-400 mb-3" />
                    <p className="text-gray-600 text-center">이송할 병원을 선택해주세요</p>
                  </div>

                  <div className="max-h-[520px] space-y-3 overflow-y-auto pr-2">
                    {[...hospitals]
                      .sort((a, b) => (a.estimatedTime + a.currentWaitTime) - (b.estimatedTime + b.currentWaitTime))
                      .map((hospital) => (
                        <button
                          key={hospital.id}
                          type="button"
                          onClick={() => setSelectedHospitalId(hospital.id)}
                          className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-blue-400 hover:bg-blue-50"
                        >
                          <p className="font-semibold text-gray-900">{hospital.name}</p>
                          <p className="mt-1 text-xs text-gray-500">{hospital.address}</p>
                          <p className="mt-2 text-sm text-blue-700">
                            총 {hospital.estimatedTime + hospital.currentWaitTime}분 예상
                          </p>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 환자 정보 입력 */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">환자 기본 정보</h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">환자명 *</Label>
                  <Input
                    id="name"
                    value={patientData.name}
                    onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age">나이 *</Label>
                    <Input
                      id="age"
                      type="number"
                      value={patientData.age}
                      onChange={(e) =>
                        setPatientData({ ...patientData, age: parseInt(e.target.value) })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="gender">성별 *</Label>
                    <select
                      id="gender"
                      value={patientData.gender}
                      onChange={(e) =>
                        setPatientData({ ...patientData, gender: e.target.value as 'male' | 'female' })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    >
                      <option value="male">남성</option>
                      <option value="female">여성</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="symptoms">증상 *</Label>
                  <textarea
                    id="symptoms"
                    value={patientData.symptoms}
                    onChange={(e) => setPatientData({ ...patientData, symptoms: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[80px]"
                    required
                  />
                </div>

                {mode === 'patient' ? (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-blue-900">AI 판단 중증도</p>
                        <p className="mt-1 text-xs text-blue-700">
                          환자모드는 KTAS를 직접 선택하지 않고 증상 기반으로 자동 판단합니다.
                        </p>
                      </div>
                      <Badge className={getSeverityColor(displaySeverity)}>{displaySeverity}</Badge>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="severity">중증도 (KTAS) *</Label>
                    <select
                      id="severity"
                      value={patientData.severity}
                      onChange={(e) => setPatientData({ ...patientData, severity: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    >
                      <option value="KTAS1">KTAS 1 (소생)</option>
                      <option value="KTAS2">KTAS 2 (응급)</option>
                      <option value="KTAS3">KTAS 3 (긴급)</option>
                      <option value="KTAS4">KTAS 4 (준긴급)</option>
                      <option value="KTAS5">KTAS 5 (비긴급)</option>
                    </select>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">활력 징후</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bloodPressure">혈압</Label>
                    <Input
                      id="bloodPressure"
                      value={patientData.bloodPressure}
                      onChange={(e) =>
                        setPatientData({ ...patientData, bloodPressure: e.target.value })
                      }
                      placeholder="120/80"
                    />
                  </div>

                  <div>
                    <Label htmlFor="heartRate">심박수 (bpm)</Label>
                    <Input
                      id="heartRate"
                      type="number"
                      value={patientData.heartRate}
                      onChange={(e) =>
                        setPatientData({ ...patientData, heartRate: parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="temperature">체온 (°C)</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      value={patientData.temperature}
                      onChange={(e) =>
                        setPatientData({ ...patientData, temperature: parseFloat(e.target.value) })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="oxygenSaturation">산소포화도 (%)</Label>
                    <Input
                      id="oxygenSaturation"
                      type="number"
                      value={patientData.oxygenSaturation}
                      onChange={(e) =>
                        setPatientData({
                          ...patientData,
                          oxygenSaturation: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* 병원 선택 */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">이송 병원 선택</h3>

              {!selectedHospitalId || !selectedHospital ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-gray-600 text-center">
                    아래에서 이송할 병원을 선택해주세요
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600 mb-4">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">병원이 선택되었습니다</span>
                  </div>
                  <HospitalCard
                    hospital={selectedHospital}
                    showActions={false}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedHospitalId(null)}
                    className="w-full"
                  >
                    다른 병원 선택
                  </Button>
                </div>
              )}
            </Card>

            {!selectedHospitalId && (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                <h4 className="font-semibold text-gray-900">가까운 병원 목록</h4>
                {[...hospitals]
                  .sort((a, b) => a.distance - b.distance)
                  .map((hospital) => (
                    <div
                      key={hospital.id}
                      onClick={() => setSelectedHospitalId(hospital.id)}
                      className="cursor-pointer hover:ring-2 hover:ring-blue-500 rounded-lg transition-all"
                    >
                      <HospitalCard hospital={hospital} showActions={false} />
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
        )}

        {/* 제출 버튼 */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">이송 준비 완료</h4>
              <p className="text-sm text-gray-600 mt-1">
                출발 버튼을 누르면 선택한 병원에 도착 예정 알림이 전송됩니다
              </p>
            </div>

            <Button
              type="submit"
              disabled={!selectedHospitalId || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-6 text-lg"
            >
              {isSubmitting ? (
                <>처리 중...</>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  출발
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
