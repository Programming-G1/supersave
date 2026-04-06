package com.supersave.backend.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AiGuideRequest(
        @NotBlank @Size(max = 500) String symptomText,
        @NotBlank String severityLevel,
        @Size(max = 500) String userQuestion
) {
}
