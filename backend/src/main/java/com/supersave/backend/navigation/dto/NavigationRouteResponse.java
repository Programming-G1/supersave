package com.supersave.backend.navigation.dto;

import java.util.List;

public record NavigationRouteResponse(
        double distanceKm,
        int durationMinutes,
        List<RoutePoint> path,
        List<RoadSegment> roads
) {
    public record RoutePoint(
            double lat,
            double lng
    ) {}

    /**
     * 도로 구간별 교통 정보.
     * vertexes: [lng, lat, lng, lat, ...] 형식의 좌표 배열 (카카오 API 원본 그대로)
     * trafficSpeed: 해당 구간의 교통 속도 (km/h)
     * trafficState: 교통 상태 (0: 정보없음, 1: 원활, 2: 서행, 3: 지체, 4: 정체)
     */
    public record RoadSegment(
            List<Double> vertexes,
            double trafficSpeed,
            int trafficState
    ) {}
}
