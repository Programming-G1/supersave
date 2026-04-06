import { Hospital } from '../types';
import { MapPin, Navigation } from 'lucide-react';
import { Card } from './ui/card';
import { useState } from 'react';

interface MapProps {
  hospitals: Hospital[];
  selectedHospitalId?: string;
  onHospitalClick?: (hospitalId: string) => void;
  userLocation?: { lat: number; lng: number };
}

export default function Map({ hospitals, selectedHospitalId, onHospitalClick, userLocation }: MapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // 서울 중심 좌표
  const centerLat = 37.5665;
  const centerLng = 126.9780;

  // 좌표를 픽셀 위치로 변환 (간단한 선형 변환)
  const coordToPixel = (lat: number, lng: number) => {
    const scale = 8000; // 조정 가능한 스케일
    const x = ((lng - centerLng) * scale) + 400;
    const y = ((centerLat - lat) * scale) + 300;
    return { x, y };
  };

  const getCongestionColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'high':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="relative w-full h-[600px] bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
      {/* 지도 배경 격자 */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* 지도 제목 */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md px-4 py-2 z-10">
        <h3 className="font-semibold text-gray-900">서울시 응급실 현황</h3>
        <p className="text-xs text-gray-500">실시간 업데이트</p>
      </div>

      {/* 범례 */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md px-4 py-3 z-10">
        <p className="text-xs font-semibold text-gray-700 mb-2">혼잡도</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600">원활</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-xs text-gray-600">보통</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-gray-600">혼잡</span>
          </div>
        </div>
      </div>

      {/* 사용자 위치 */}
      {userLocation && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
          style={{
            left: `${coordToPixel(userLocation.lat, userLocation.lng).x}px`,
            top: `${coordToPixel(userLocation.lat, userLocation.lng).y}px`,
          }}
        >
          <div className="relative">
            <Navigation className="w-6 h-6 text-blue-600 fill-blue-600 animate-pulse" />
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-blue-600 text-white text-xs px-2 py-1 rounded">
              현재 위치
            </div>
          </div>
        </div>
      )}

      {/* 병원 마커 */}
      {hospitals.map((hospital) => {
        const pos = coordToPixel(hospital.coordinates.lat, hospital.coordinates.lng);
        const isSelected = selectedHospitalId === hospital.id;
        const isHovered = hoveredId === hospital.id;

        return (
          <div
            key={hospital.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
            style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
            onMouseEnter={() => setHoveredId(hospital.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onHospitalClick?.(hospital.id)}
          >
            {/* 마커 */}
            <div
              className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                isSelected
                  ? 'ring-4 ring-blue-400 scale-125'
                  : isHovered
                  ? 'scale-110'
                  : ''
              } ${getCongestionColor(hospital.congestionLevel)}`}
            >
              <MapPin className="w-6 h-6 text-white fill-white" />
              
              {/* 병상 수 배지 */}
              <div className="absolute -top-2 -right-2 bg-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-900 shadow-md">
                {hospital.beds.general + hospital.beds.icu + hospital.beds.surgery}
              </div>
            </div>

            {/* 호버 시 정보 카드 */}
            {(isHovered || isSelected) && (
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-3 w-64 z-30">
                <h4 className="font-semibold text-sm text-gray-900 mb-1">{hospital.name}</h4>
                <p className="text-xs text-gray-500 mb-2">{hospital.address}</p>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500">가용 병상</p>
                    <p className="font-semibold text-gray-900">
                      {hospital.beds.general + hospital.beds.icu + hospital.beds.surgery}개
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">대기 시간</p>
                    <p className="font-semibold text-gray-900">{hospital.currentWaitTime}분</p>
                  </div>
                  <div>
                    <p className="text-gray-500">거리</p>
                    <p className="font-semibold text-gray-900">{hospital.distance}km</p>
                  </div>
                  <div>
                    <p className="text-gray-500">이동 시간</p>
                    <p className="font-semibold text-gray-900">{hospital.estimatedTime}분</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </Card>
  );
}
