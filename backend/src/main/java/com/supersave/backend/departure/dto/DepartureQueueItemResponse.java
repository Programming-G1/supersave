package com.supersave.backend.departure.dto;

import com.supersave.backend.departure.entity.DepartureStatus;
import com.supersave.backend.departure.entity.RequesterType;

import java.time.LocalDateTime;

public record DepartureQueueItemResponse(
        Long registrationId,
        Long hospitalId,
        String hospitalName,
        RequesterType requesterType,
        int etaMinutes,
        String severityLevel,
        String symptomSummary,
        LocalDateTime createdAt,
        DepartureStatus status
) {
}
