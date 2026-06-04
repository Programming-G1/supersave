import { Hospital } from '../types';
import { Card } from './ui/card';
import { useState } from 'react';
import { Map as KakaoMap, MapMarker, CustomOverlayMap, Polyline } from 'react-kakao-maps-sdk';
import type { RoadSegment } from '../../types';

interface MapProps {
  hospitals: Hospital[];
  selectedHospitalId?: string;
  onHospitalClick?: (hospitalId: string) => void;
  userLocation?: { lat: number; lng: number };
  routePath?: { lat: number; lng: number }[];
  routeRoads?: RoadSegment[];
}

/** 교통 상태(trafficState)에 따른 폴리라인 색상 */
function getTrafficColor(trafficState: number): string {
  switch (trafficState) {
    case 1: return '#22c55e'; // 원활 - green
    case 2: return '#f59e0b'; // 서행 - amber
    case 3: return '#f97316'; // 지체 - orange
    case 4: return '#ef4444'; // 정체 - red
    default: return '#3b82f6'; // 정보없음 - blue
  }
}

/** 교통 상태 라벨 */
function getTrafficLabel(trafficState: number): string {
  switch (trafficState) {
    case 1: return '원활';
    case 2: return '서행';
    case 3: return '지체';
    case 4: return '정체';
    default: return '정보없음';
  }
}

/** vertexes [lng, lat, lng, lat, ...] -> [{lat, lng}, ...] 변환 */
function vertexesToPath(vertexes: number[]): { lat: number; lng: number }[] {
  const path: { lat: number; lng: number }[] = [];
  for (let i = 0; i + 1 < vertexes.length; i += 2) {
    path.push({ lat: vertexes[i + 1], lng: vertexes[i] });
  }
  return path;
}

export default function Map({ hospitals, selectedHospitalId, onHospitalClick, userLocation, routePath, routeRoads }: MapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // 서울 중심 좌표
  const centerLat = 37.5665;
  const centerLng = 126.9780;
  
  const mapCenter = userLocation || { lat: centerLat, lng: centerLng };

  const getCongestionBadgeColor = (level: string) => {
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

  // 교통 상태별 구간이 있으면 그것을 사용, 없으면 기존 routePath 사용
  const hasRoads = routeRoads && routeRoads.length > 0;

  return (
    <Card className="relative w-full h-[600px] overflow-hidden">
      {/* 지도 제목 */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md px-4 py-2 z-10">
        <h3 className="font-semibold text-gray-900">전국 응급실 현황</h3>
        <p className="text-xs text-gray-500">실시간 업데이트 (카카오맵 연동)</p>
      </div>

      {/* 범례 */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md px-4 py-3 z-10">
        <p className="text-xs font-semibold text-gray-700 mb-2">교통 상황</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600">원활</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span className="text-xs text-gray-600">서행</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-xs text-gray-600">지체</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-gray-600">정체</span>
          </div>
        </div>
      </div>

      <KakaoMap
        center={mapCenter}
        style={{ width: '100%', height: '100%' }}
        level={6} // 지도 확대 레벨
      >
        {/* 사용자 위치 마커 */}
        {userLocation && (
          <MapMarker
            position={userLocation}
            image={{
              src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
              size: { width: 24, height: 35 },
            }}
            title="현재 위치"
          />
        )}

        {/* 병원 마커 */}
        {hospitals.map((hospital) => {
          const isSelected = selectedHospitalId === hospital.id;
          const isHovered = hoveredId === hospital.id;
          const color = getCongestionBadgeColor(hospital.congestionLevel);
          const totalBeds = hospital.beds.general + hospital.beds.icu + hospital.beds.surgery;

          return (
            <CustomOverlayMap
              key={hospital.id}
              position={{ lat: hospital.coordinates.lat, lng: hospital.coordinates.lng }}
              zIndex={isSelected || isHovered ? 20 : 10}
            >
              <div 
                className="relative flex items-center justify-center cursor-pointer"
                onMouseEnter={() => setHoveredId(hospital.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onHospitalClick?.(hospital.id)}
              >
                {/* 커스텀 마커 UI */}
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full text-white shadow-lg transition-all ${
                    isSelected ? 'ring-4 ring-blue-400 scale-125' : isHovered ? 'scale-110' : ''
                  } ${color}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                  
                  <div className="absolute -top-2 -right-2 bg-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-900 shadow-md ring-1 ring-gray-200">
                    {totalBeds}
                  </div>
                </div>

                {/* 호버/선택 시 정보 카드 */}
                {(isHovered || isSelected) && (
                  <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-3 w-64 text-left z-30">
                    <h4 className="font-semibold text-sm text-gray-900 mb-1">{hospital.name}</h4>
                    <p className="text-xs text-gray-500 mb-2">{hospital.address}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">가용 병상</p>
                        <p className="font-semibold text-gray-900">{totalBeds}개</p>
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
            </CustomOverlayMap>
          );
        })}

        {/* 선택된 병원과 사용자 간의 경로 선 (교통 상태별 색상) */}
        {userLocation && selectedHospitalId && hospitals.find(h => h.id === selectedHospitalId)?.coordinates && (
          hasRoads ? (
            // 교통 상태별로 색상이 다른 구간별 Polyline
            <>
              {routeRoads!.map((road, idx) => {
                const segmentPath = vertexesToPath(road.vertexes);
                if (segmentPath.length < 2) return null;
                return (
                  <Polyline
                    key={`road-${idx}`}
                    path={segmentPath}
                    strokeWeight={6}
                    strokeColor={getTrafficColor(road.trafficState)}
                    strokeOpacity={0.9}
                    strokeStyle="solid"
                  />
                );
              })}
            </>
          ) : (
            // 교통 정보가 없으면 기존 단색 Polyline
            <Polyline
              path={routePath && routePath.length > 1
                ? routePath
                : [
                  userLocation,
                  hospitals.find(h => h.id === selectedHospitalId)!.coordinates as {lat: number, lng: number}
                ]}
              strokeWeight={5}
              strokeColor="#3b82f6"
              strokeOpacity={0.8}
              strokeStyle="solid"
            />
          )
        )}
      </KakaoMap>
    </Card>
  );
}
