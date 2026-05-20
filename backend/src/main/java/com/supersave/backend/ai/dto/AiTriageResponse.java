package com.supersave.backend.ai.dto;

import java.util.List;

public record AiTriageResponse(
        String severityLevel,
        String summary,
        List<String> recommendedDepartments,
        List<String> warningSigns,
        String reasoning,
        boolean aiUsed
) {
}
