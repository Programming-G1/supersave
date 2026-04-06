package com.supersave.backend.recommendation.dto;

public record RecommendationResultResponse(
        Long hospitalId,
        String hospitalName,
        double score,
        double distanceKm,
        int etaMinutes,
        int estimatedWaitMinutes,
        int availableBeds,
        String reason
) {
}
