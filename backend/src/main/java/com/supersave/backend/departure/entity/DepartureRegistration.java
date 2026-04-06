package com.supersave.backend.departure.entity;

import java.time.LocalDateTime;

public record DepartureRegistration(
        Long id,
        Long hospitalId,
        double userLatitude,
        double userLongitude,
        int etaMinutes,
        String severityLevel,
        String symptomSummary,
        LocalDateTime createdAt
) {
}
