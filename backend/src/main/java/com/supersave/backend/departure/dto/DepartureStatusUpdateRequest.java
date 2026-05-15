package com.supersave.backend.departure.dto;

import com.supersave.backend.departure.entity.DepartureStatus;
import jakarta.validation.constraints.NotNull;

public record DepartureStatusUpdateRequest(
        @NotNull DepartureStatus status
) {
}
