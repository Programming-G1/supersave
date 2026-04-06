package com.supersave.backend.departure.dto;

import java.time.LocalDateTime;

public record DepartureResponse(
        Long registrationId,
        Long hospitalId,
        String hospitalName,
        int etaMinutes,
        int queuePosition,
        int projectedWaitMinutes,
        String advisory,
        LocalDateTime createdAt
) {
}
