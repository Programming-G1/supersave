package com.supersave.backend.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.supersave.backend.ai.config.GeminiProperties;
import com.supersave.backend.ai.dto.AiTriageRequest;
import com.supersave.backend.ai.dto.AiTriageResponse;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;

class AiTriageServiceTest {

    @Test
    void keepsSimpleHangoverAtLowAcuityEvenWhenGeminiIsEnabled() {
        GeminiProperties properties = new GeminiProperties();
        properties.setEnabled(true);
        properties.setApiKey("test-key");

        AiTriageService service = new AiTriageService(RestClient.builder(), properties, new ObjectMapper());

        AiTriageResponse response = service.triage(new AiTriageRequest(
                "숙취 때문에 머리가 아프고 속이 메스꺼워요",
                28,
                "female",
                "118/76",
                78,
                36.7,
                98
        ));

        assertThat(response.severityLevel()).isEqualTo("KTAS4");
        assertThat(response.aiUsed()).isFalse();
        assertThat(response.reasoning()).contains("숙취");
    }

    @Test
    void doesNotDowngradeHangoverWhenRedFlagsArePresent() {
        GeminiProperties properties = new GeminiProperties();
        AiTriageService service = new AiTriageService(RestClient.builder(), properties, new ObjectMapper());

        AiTriageResponse response = service.triage(new AiTriageRequest(
                "과음 후 의식이 떨어지고 숨쉬기 힘들어요",
                31,
                "male",
                "130/85",
                96,
                36.8,
                97
        ));

        assertThat(response.severityLevel()).isEqualTo("KTAS1");
        assertThat(response.reasoning()).doesNotContain("숙취");
    }
}
