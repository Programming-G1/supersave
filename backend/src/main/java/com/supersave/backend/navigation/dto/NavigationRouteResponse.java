package com.supersave.backend.navigation.dto;

import java.util.List;

public record NavigationRouteResponse(
        double distanceKm,
        int durationMinutes,
        List<RoutePoint> path
) {
    public record RoutePoint(
            double lat,
            double lng
    ) {
    }
}
