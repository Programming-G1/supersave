package com.supersave.backend.departure.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DepartureRequest(
        @NotNull Long hospitalId,
        @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double userLatitude,
        @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double userLongitude,
        @Min(1) Integer etaMinutes,
        @NotBlank String severityLevel,
        @Size(max = 500) String symptomSummary
) {
}
