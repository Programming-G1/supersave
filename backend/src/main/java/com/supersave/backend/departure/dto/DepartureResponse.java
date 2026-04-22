package com.supersave.backend.departure.dto;

import com.supersave.backend.departure.entity.RequesterType;

import java.time.LocalDateTime;

public record DepartureResponse(
        Long registrationId,
        Long hospitalId,
        String hospitalName,
        RequesterType requesterType,
        int etaMinutes,
        int queuePosition,
        int projectedWaitMinutes,
        String advisory,
        LocalDateTime createdAt
) {
}
