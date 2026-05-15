import { useParams, Link, useNavigate } from 'react-router';
import { mockHospitals, congestionData } from '../data/mockData';
import { useMode } from '../contexts/ModeContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  Bed,
  Users,
  Activity,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function HospitalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mode } = useMode();
  const hospital = mockHospitals.find((h) => h.id === id);

  if (!hospital) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">병원을 찾을 수 없습니다</h2>
        <Button asChild>
          <Link to={mode ? `/dashboard/${mode}` : "/"}>대시보드로 돌아가기</Link>
        </Button>
      </div>
    );
  }

  const getCongestionColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'high':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getCongestionText = (level: string) => {
    switch (level) {
      case 'low':
        return '원활';
      case 'medium':
        return '보통';
      case 'high':
        return '혼잡';
      default:
        return '알 수 없음';
    }
  };

  const totalBeds = hospital.beds.general + hospital.beds.icu + hospital.beds.surgery;
  const estimatedWait = hospital.currentWaitTime + hospital.arrivingPatients * 5;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>대시보드로 돌아가기</span>
          </Link>
        </Button>

        <Button
          onClick={() => navigate('/transfer', { state: { selectedHospitalId: hospital.id } })}
          className="bg-blue-600 hover:bg-blue-700"
        >
          이 병원으로 이송 요청
        </Button>
      </div>

      {/* 병원 기본 정보 */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{hospital.name}</h1>
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <MapPin className="w-4 h-4" />
              <span>{hospital.address}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4" />
              <span>응급실 직통: 02-1234-5678</span>
            </div>
          </div>

          <Badge className={`text-lg px-4 py-2 ${getCongestionColor(hospital.congestionLevel)}`}>
            {getCongestionText(hospital.congestionLevel)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg">
              <Bed className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">가용 병상</p>
              <p className="text-2xl font-bold text-gray-900">{totalBeds}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-600 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">대기 환자</p>
              <p className="text-2xl font-bold text-gray-900">{hospital.waitingPatients}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-600 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">대기 시간</p>
              <p className="text-2xl font-bold text-gray-900">{hospital.currentWaitTime}분</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-green-600 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">이동 시간</p>
              <p className="text-2xl font-bold text-gray-900">{hospital.estimatedTime}분</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 상세 정보 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 병상 현황 */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bed className="w-5 h-5 text-blue-600" />
            병상 상세 현황
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">일반 병상</span>
                <span className="text-sm font-semibold text-gray-900">{hospital.beds.general}개</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full"
                  style={{ width: `${(hospital.beds.general / 20) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">중환자실 (ICU)</span>
                <span className="text-sm font-semibold text-gray-900">{hospital.beds.icu}개</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-purple-500 h-3 rounded-full"
                  style={{ width: `${(hospital.beds.icu / 10) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">수술실</span>
                <span className="text-sm font-semibold text-gray-900">{hospital.beds.surgery}개</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-orange-500 h-3 rounded-full"
                  style={{ width: `${(hospital.beds.surgery / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">총 가용 병상</span>
              <span className="text-xl font-bold text-blue-600">{totalBeds}개</span>
            </div>
          </div>
        </Card>

        {/* 전문의 및 진료과 */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            전문의 상주 현황
          </h3>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">심장내과</span>
              {hospital.specialists.cardiology ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-300" />
              )}
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">신경외과</span>
              {hospital.specialists.neurology ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-300" />
              )}
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">정형외과</span>
              {hospital.specialists.orthopedics ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-300" />
              )}
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">소아과</span>
              {hospital.specialists.pediatrics ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-300" />
              )}
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">외상외과</span>
              {hospital.specialists.trauma ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-300" />
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">진료 가능 과목</h4>
            <div className="flex flex-wrap gap-2">
              {hospital.departments.map((dept, idx) => (
                <Badge key={idx} variant="outline">
                  {dept}
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        {/* 의료 장비 */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            주요 의료 장비
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-lg ${
                hospital.equipment.ct ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">CT</span>
                {hospital.equipment.ct ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-300" />
                )}
              </div>
              <p className="text-xs text-gray-600">컴퓨터 단층촬영</p>
            </div>

            <div
              className={`p-4 rounded-lg ${
                hospital.equipment.mri ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">MRI</span>
                {hospital.equipment.mri ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-300" />
                )}
              </div>
              <p className="text-xs text-gray-600">자기공명영상</p>
            </div>

            <div
              className={`p-4 rounded-lg ${
                hospital.equipment.xray ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">X-Ray</span>
                {hospital.equipment.xray ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-300" />
                )}
              </div>
              <p className="text-xs text-gray-600">엑스레이</p>
            </div>

            <div
              className={`p-4 rounded-lg ${
                hospital.equipment.ultrasound ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">초음파</span>
                {hospital.equipment.ultrasound ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-300" />
                )}
              </div>
              <p className="text-xs text-gray-600">초음파 진단</p>
            </div>
          </div>
        </Card>

        {/* 대기 시간 상세 */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            대기 시간 상세
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">현재 대기 환자</span>
                <span className="text-xl font-bold text-gray-900">{hospital.waitingPatients}명</span>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">도착 예정 환자</span>
                <span className="text-xl font-bold text-gray-900">{hospital.arrivingPatients}명</span>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">현재 예상 대기</span>
                <span className="text-xl font-bold text-blue-600">{hospital.currentWaitTime}분</span>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-700">이송 시 예상 대기</span>
                <span className="text-xl font-bold text-purple-600">{estimatedWait}분</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                * 이동 시간 {hospital.estimatedTime}분 포함
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 시간대별 혼잡도 추이 */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          시간대별 혼잡도 추이
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={congestionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="patients" stroke="#3b82f6" fill="#93c5fd" />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-sm text-gray-500 mt-4">
          * 과거 데이터 기반 예측. 실제 상황은 달라질 수 있습니다.
        </p>
      </Card>

      {/* 하단 액션 버튼 */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" asChild>
          <Link to={mode ? `/dashboard/${mode}` : "/"}>목록으로</Link>
        </Button>
        <Button
          onClick={() => navigate('/transfer', { state: { selectedHospitalId: hospital.id } })}
          className="bg-blue-600 hover:bg-blue-700"
        >
          이송 요청하기
        </Button>
      </div>
    </div>
  );
}
