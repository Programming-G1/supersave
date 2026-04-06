package com.supersave.backend.recommendation;

import com.supersave.backend.hospital.repository.MockHospitalRepository;
import com.supersave.backend.recommendation.dto.RecommendationRequest;
import com.supersave.backend.recommendation.dto.RecommendationResultResponse;
import com.supersave.backend.recommendation.service.RecommendationService;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class RecommendationServiceTest {

    private final RecommendationService recommendationService = new RecommendationService(new MockHospitalRepository());

    @Test
    void recommendsHospitalsInDescendingScoreOrder() {
        List<RecommendationResultResponse> results =
                recommendationService.recommend(new RecommendationRequest(37.5665, 126.9780, "KTAS2", "흉통과 호흡곤란"));

        assertThat(results).isNotEmpty();
        assertThat(results.getFirst().score()).isGreaterThanOrEqualTo(results.get(1).score());
        assertThat(results.getFirst().reason()).contains("예상 ETA");
    }
}
