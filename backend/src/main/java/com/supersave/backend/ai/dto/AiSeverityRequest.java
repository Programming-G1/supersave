package com.supersave.backend.ai.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AiSeverityRequest(
        @NotBlank @Size(max = 500) String symptomText,
        @Min(0) @Max(120) Integer age,
        @Size(max = 20) String bloodPressure,
        @Min(0) @Max(250) Integer heartRate,
        @DecimalMin("0.0") @DecimalMax("45.0") Double temperature,
        @Min(0) @Max(100) Integer oxygenSaturation
) {
}
