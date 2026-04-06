import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { mockHospitals, mockPatient } from '../data/mockData';
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

export default function TransferRequest() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(
    location.state?.selectedHospitalId || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferStarted, setTransferStarted] = useState(false);
  const [eta, setEta] = useState<number>(0);

  // 환자 정보 폼 상태
  const [patientData, setPatientData] = useState({
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

  const selectedHospital = mockHospitals.find((h) => h.id === selectedHospitalId);

  useEffect(() => {
    if (transferStarted && selectedHospital) {
      setEta(selectedHospital.estimatedTime);
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
  }, [transferStarted, selectedHospital]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedHospitalId) {
      toast.error('이송할 병원을 선택해주세요.');
      return;
    }

    setIsSubmitting(true);

    // 이송 요청 시뮬레이션
    setTimeout(() => {
      setIsSubmitting(false);
      setTransferStarted(true);
      toast.success('이송이 시작되었습니다!', {
        description: `${selectedHospital?.name}에 도착 예정 알림이 전송되었습니다.`,
      });
    }, 1500);
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
                {selectedHospital.estimatedTime - eta} / {selectedHospital.estimatedTime}분
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-1000"
                style={{
                  width: `${((selectedHospital.estimatedTime - eta) / selectedHospital.estimatedTime) * 100}%`,
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
              <Badge className={getSeverityColor(patientData.severity)}>{patientData.severity}</Badge>
            </div>
          </div>
        </Card>

        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => setTransferStarted(false)}>
            이송 취소
          </Button>
          <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700">
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

              {!selectedHospitalId ? (
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
                    hospital={mockHospitals.find((h) => h.id === selectedHospitalId)!}
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
                {mockHospitals
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
