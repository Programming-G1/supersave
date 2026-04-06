import { useNavigate } from 'react-router';
import { useMode } from '../contexts/ModeContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Ambulance, Building2, User, Activity } from 'lucide-react';

export default function ModeSelection() {
  const navigate = useNavigate();
  const { setMode } = useMode();

  const handleSelectMode = (mode: 'paramedic' | 'hospital' | 'patient') => {
    setMode(mode);
    if (mode === 'hospital') {
      navigate('/hospital-manager');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">SuperSave</h1>
          <p className="text-lg text-gray-600">응급실 이송 최적화 서비스</p>
          <p className="text-sm text-gray-500 mt-2">사용자 모드를 선택해주세요</p>
        </div>

        {/* 모드 선택 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 구급대원 모드 */}
          <Card
            className="p-8 hover:shadow-xl transition-all cursor-pointer border-2 hover:border-blue-500 group"
            onClick={() => handleSelectMode('paramedic')}
          >
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center w-20 h-20 mx-auto bg-gradient-to-br from-red-100 to-red-200 rounded-2xl group-hover:from-red-500 group-hover:to-red-600 transition-all">
                <Ambulance className="w-10 h-10 text-red-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">구급대원</h3>
                <p className="text-sm text-gray-600">
                  실시간 병원 현황 조회<br />
                  스마트 이송 추천<br />
                  AI 의사결정 지원
                </p>
              </div>
              <Button className="w-full bg-red-600 hover:bg-red-700">
                구급대원으로 시작
              </Button>
            </div>
          </Card>

          {/* 병원관계자 모드 */}
          <Card
            className="p-8 hover:shadow-xl transition-all cursor-pointer border-2 hover:border-green-500 group"
            onClick={() => handleSelectMode('hospital')}
          >
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center w-20 h-20 mx-auto bg-gradient-to-br from-green-100 to-green-200 rounded-2xl group-hover:from-green-500 group-hover:to-green-600 transition-all">
                <Building2 className="w-10 h-10 text-green-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">병원관계자</h3>
                <p className="text-sm text-gray-600">
                  도착 예정 환자 관리<br />
                  예약 등록 및 취소<br />
                  병상 현황 업데이트
                </p>
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                병원관계자로 시작
              </Button>
            </div>
          </Card>

          {/* 환자 모드 */}
          <Card
            className="p-8 hover:shadow-xl transition-all cursor-pointer border-2 hover:border-purple-500 group"
            onClick={() => handleSelectMode('patient')}
          >
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl group-hover:from-purple-500 group-hover:to-purple-600 transition-all">
                <User className="w-10 h-10 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">환자/보호자</h3>
                <p className="text-sm text-gray-600">
                  응급실 현황 조회<br />
                  대기시간 확인<br />
                  병원 정보 검색
                </p>
              </div>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                환자로 시작
              </Button>
            </div>
          </Card>
        </div>

        {/* 하단 정보 */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-500">
            © 2026 SuperSave. 서울시 응급의료 정보 시스템과 연동
          </p>
        </div>
      </div>
    </div>
  );
}
