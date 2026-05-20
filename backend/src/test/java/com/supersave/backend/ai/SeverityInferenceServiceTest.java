package com.supersave.backend.ai;

import com.supersave.backend.ai.config.GeminiProperties;
import com.supersave.backend.ai.dto.AiSeverityRequest;
import com.supersave.backend.ai.dto.AiSeverityResponse;
import com.supersave.backend.ai.service.SeverityInferenceService;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;

class SeverityInferenceServiceTest {

    private final SeverityInferenceService severityInferenceService =
            new SeverityInferenceService(RestClient.builder(), new GeminiProperties());

    @Test
    void usesConservativeFallbackWhenGeminiIsDisabled() {
        AiSeverityResponse response = severityInferenceService.infer(
                new AiSeverityRequest("몸이 너무 처지고 기운이 없어요", 82, "118/72", 88, 36.8, 97)
        );

        assertThat(response.severityLevel()).isEqualTo("KTAS3");
        assertThat(response.source()).isEqualTo("FALLBACK");
    }

    @Test
    void escalatesToKtas1ForLowOxygenSaturation() {
        AiSeverityResponse response = severityInferenceService.infer(
                new AiSeverityRequest("숨쉬기 답답하고 멍해요", 54, "102/64", 108, 37.1, 88)
        );

        assertThat(response.severityLevel()).isEqualTo("KTAS1");
        assertThat(response.source()).isEqualTo("FALLBACK");
    }
}
