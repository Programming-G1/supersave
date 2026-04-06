import { Link } from 'react-router';
import { Hospital } from '../types';
import { Bed, Users, Clock, MapPin, Activity, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface HospitalCardProps {
  hospital: Hospital;
  showActions?: boolean;
  onSelect?: (hospitalId: string) => void;
}

export default function HospitalCard({ hospital, showActions = true, onSelect }: HospitalCardProps) {
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

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Link to={`/hospital/${hospital.id}`} className="group">
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
              {hospital.name}
            </h3>
          </Link>
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{hospital.address}</span>
          </div>
        </div>
        
        <Badge className={getCongestionColor(hospital.congestionLevel)}>
          {getCongestionText(hospital.congestionLevel)}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-lg">
            <Bed className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-gray-500 text-xs">가용 병상</p>
            <p className="font-semibold text-gray-900">{totalBeds}개</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center justify-center w-8 h-8 bg-purple-50 rounded-lg">
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="text-gray-500 text-xs">대기 환자</p>
            <p className="font-semibold text-gray-900">{hospital.waitingPatients}명</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center justify-center w-8 h-8 bg-orange-50 rounded-lg">
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <p className="text-gray-500 text-xs">예상 대기</p>
            <p className="font-semibold text-gray-900">{hospital.currentWaitTime}분</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center justify-center w-8 h-8 bg-green-50 rounded-lg">
            <Activity className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-gray-500 text-xs">이동 시간</p>
            <p className="font-semibold text-gray-900">{hospital.estimatedTime}분</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">병상 현황</p>
        <div className="flex gap-2">
          <div className="flex-1 bg-gray-100 rounded-lg p-2">
            <p className="text-xs text-gray-500">일반</p>
            <p className="text-sm font-semibold text-gray-900">{hospital.beds.general}</p>
          </div>
          <div className="flex-1 bg-gray-100 rounded-lg p-2">
            <p className="text-xs text-gray-500">중환자</p>
            <p className="text-sm font-semibold text-gray-900">{hospital.beds.icu}</p>
          </div>
          <div className="flex-1 bg-gray-100 rounded-lg p-2">
            <p className="text-xs text-gray-500">수술실</p>
            <p className="text-sm font-semibold text-gray-900">{hospital.beds.surgery}</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">진료 가능 과목</p>
        <div className="flex flex-wrap gap-1.5">
          {hospital.departments.slice(0, 4).map((dept, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {dept}
            </Badge>
          ))}
          {hospital.departments.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{hospital.departments.length - 4}
            </Badge>
          )}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">의료 장비</p>
        <div className="grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center gap-1">
            {hospital.equipment.ct ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-gray-300" />
            )}
            <span className="text-xs text-gray-600">CT</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            {hospital.equipment.mri ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-gray-300" />
            )}
            <span className="text-xs text-gray-600">MRI</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            {hospital.equipment.xray ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-gray-300" />
            )}
            <span className="text-xs text-gray-600">X-Ray</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            {hospital.equipment.ultrasound ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-gray-300" />
            )}
            <span className="text-xs text-gray-600">초음파</span>
          </div>
        </div>
      </div>

      {showActions && (
        <div className="flex gap-2">
          <Button asChild variant="outline" className="flex-1">
            <Link to={`/hospital/${hospital.id}`}>상세 정보</Link>
          </Button>
          {onSelect && (
            <Button onClick={() => onSelect(hospital.id)} className="flex-1 bg-blue-600 hover:bg-blue-700">
              이 병원 선택
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
