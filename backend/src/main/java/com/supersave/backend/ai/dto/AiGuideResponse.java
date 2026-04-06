package com.supersave.backend.ai.dto;

import java.util.List;

public record AiGuideResponse(
        String safetyDisclaimer,
        String summary,
        String recommendationReason,
        List<String> actionGuide,
        String answer
) {
}
