import { useEffect, useState } from 'react';
import Map from '../components/Map';
import HospitalCard from '../components/HospitalCard';
import SymptomInput, { PatientSymptomData } from '../components/SymptomInput';
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
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router';
import { useMode } from '../contexts/ModeContext';
import { toast } from 'sonner';
import { emergencyApi } from '../api';
import { useEmergencyAppData } from '../hooks/useEmergencyAppData';
import { HospitalRecommendation, Patient } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { mode } = useMode();
  const { hospitals, patientTemplate, congestionData, loading, error } = useEmergencyAppData();
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'distance' | 'waitTime' | 'beds'>('distance');
  const [showSymptomInput, setShowSymptomInput] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [recommendations, setRecommendations] = useState<HospitalRecommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);

  const userLocation = { lat: 37.5665, lng: 126.978 };

  useEffect(() => {
    if (patientTemplate && !currentPatient) {
      setCurrentPatient(patientTemplate);
    }
  }, [patientTemplate, currentPatient]);

  useEffect(() => {
    if (!currentPatient) {
      return;
    }

    let active = true;
    setRecommendationsLoading(true);
    setRecommendationsError(null);

    emergencyApi
      .getRecommendations(currentPatient)
      .then((data) => {
        if (!active) {
          return;
        }
        setRecommendations(data);
      })
      .catch((apiError: Error) => {
        if (!active) {
          return;
        }
        setRecommendations([]);
        setRecommendationsError(apiError.message || '추천 정보를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setRecommendationsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentPatient]);

  const handleSymptomSubmit = (data: PatientSymptomData) => {
    setCurrentPatient({
      id: currentPatient?.id ?? 'p1',
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
    });
    setShowSymptomInput(false);
    toast.success('증상이 입력되었습니다', {
      description: 'AI가 최적의 병원을 추천합니다',
    });
  };

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
          return a.currentWaitTime - b.currentWaitTime;
        case 'beds':
          const bedsA = a.beds.general + a.beds.icu + a.beds.surgery;
          const bedsB = b.beds.general + b.beds.icu + b.beds.surgery;
          return bedsB - bedsA;
        default:
          return 0;
      }
    });

  const allDepartments = Array.from(new Set(hospitals.flatMap((hospital) => hospital.departments)));
  const totalBeds = hospitals.reduce((sum, hospital) => sum + hospital.beds.general + hospital.beds.icu + hospital.beds.surgery, 0);
  const totalWaiting = hospitals.reduce((sum, hospital) => sum + hospital.waitingPatients, 0);
  const avgWaitTime = hospitals.length
    ? Math.round(hospitals.reduce((sum, hospital) => sum + hospital.currentWaitTime, 0) / hospitals.length)
    : 0;
  const bestWaitHospital = hospitals.reduce((best, hospital) => {
    if (!best || hospital.currentWaitTime < best.currentWaitTime) {
      return hospital;
    }
    return best;
  }, hospitals[0]);

  const handleSelectHospital = (hospitalId: string) => {
    navigate('/transfer', { state: { selectedHospitalId: hospitalId } });
  };

  if (loading || !currentPatient) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">대시보드를 불러오는 중입니다...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-600">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 증상 입력 섹션 */}
      {(mode === 'paramedic' || mode === 'patient') && (
        <>
          {!showSymptomInput ? (
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">AI 맞춤 병원 추천</h3>
                    <p className="text-sm text-gray-600">
                      {mode === 'patient' ? '증상을 입력하면' : '환자 증상을 입력하면'} AI가 최적의 병원을 추천합니다
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowSymptomInput(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  증상 입력
                </Button>
              </div>
            </Card>
          ) : (
            <SymptomInput
              onSubmit={handleSymptomSubmit}
              initialData={{
                name: currentPatient.name,
                age: currentPatient.age,
                gender: currentPatient.gender,
                symptoms: currentPatient.symptoms,
                severity: currentPatient.severity,
                bloodPressure: currentPatient.vitalSigns.bloodPressure,
                heartRate: currentPatient.vitalSigns.heartRate,
                temperature: currentPatient.vitalSigns.temperature,
                oxygenSaturation: currentPatient.vitalSigns.oxygenSaturation,
              }}
            />
          )}
        </>
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
              <p className="text-sm text-gray-500">최단 대기시간</p>
              <p className="text-2xl font-bold text-gray-900">
                {bestWaitHospital ? `${bestWaitHospital.currentWaitTime}분` : '-'}
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
              <Brain className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{bestWaitHospital?.name ?? '병원 정보 없음'}</p>
        </Card>
      </div>

      {/* 긴급 알림 */}
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900">긴급 알림</h4>
            <p className="text-sm text-yellow-800 mt-1">
              세브란스병원의 혼잡도가 높습니다. 인근 서울대학교병원 또는 고려대학교 안암병원을 추천합니다.
            </p>
          </div>
        </div>
      </Card>

      {/* 메인 컨텐츠 탭 */}
      <Tabs defaultValue="map" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="map">지도 뷰</TabsTrigger>
          <TabsTrigger value="recommendations">AI 추천</TabsTrigger>
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
                    <option value="waitTime">대기시간순</option>
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
                    className={`cursor-pointer transition-all ${
                      selectedHospitalId === hospital.id ? 'ring-2 ring-blue-500 rounded-lg' : ''
                    }`}
                  >
                    <HospitalCard hospital={hospital} showActions={false} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* AI 추천 탭 */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex-shrink-0">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">스마트 이송 추천</h3>
                <p className="text-sm text-gray-600 mt-1">
                  환자 정보: {currentPatient.name} ({currentPatient.age}세, {currentPatient.gender === 'male' ? '남' : '여'})
                </p>
                <p className="text-sm text-gray-600">증상: {currentPatient.symptoms}</p>
                <Badge className="mt-2 bg-red-600">중증도: {currentPatient.severity}</Badge>
                {(mode === 'paramedic' || mode === 'patient') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSymptomInput(true)}
                    className="mt-2 text-blue-600"
                  >
                    증상 수정
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.slice(0, 6).map((rec, index) => (
              <Card key={rec.hospital.id} className="p-4 relative">
                {/* 순위 배지 */}
                {index < 3 && (
                  <div className="absolute -top-2 -right-2 flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg">
                    <span className="text-xs font-bold text-white">{index + 1}</span>
                  </div>
                )}

                <h4 className="font-semibold text-gray-900 mb-2">{rec.hospital.name}</h4>

                {/* 점수 바 */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">적합도 점수</span>
                    <span className="text-sm font-bold text-blue-600">{rec.score}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${rec.score}%` }}
                    />
                  </div>
                </div>

                {/* 점수 세부 항목 */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="text-xs">
                    <p className="text-gray-500">거리</p>
                    <p className="font-semibold text-gray-900">{Math.round(rec.reasons.distance)}</p>
                  </div>
                  <div className="text-xs">
                    <p className="text-gray-500">가용성</p>
                    <p className="font-semibold text-gray-900">{Math.round(rec.reasons.availability)}</p>
                  </div>
                  <div className="text-xs">
                    <p className="text-gray-500">전문성</p>
                    <p className="font-semibold text-gray-900">{Math.round(rec.reasons.specialization)}</p>
                  </div>
                  <div className="text-xs">
                    <p className="text-gray-500">대기</p>
                    <p className="font-semibold text-gray-900">{Math.round(rec.reasons.waitTime)}</p>
                  </div>
                </div>

                {/* AI 분석 보기 버튼 */}
                <details className="mb-3">
                  <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                    AI 분석 보기
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-700 whitespace-pre-line">{rec.aiAnalysis}</p>
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
                          className={`h-2 rounded-full ${
                            hospital.currentWaitTime < 30
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
