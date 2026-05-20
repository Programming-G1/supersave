package com.supersave.backend.ai.service;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.supersave.backend.ai.config.GeminiProperties;
import com.supersave.backend.ai.dto.AiSeverityRequest;
import com.supersave.backend.ai.dto.AiSeverityResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class SeverityInferenceService {

    private static final Logger log = LoggerFactory.getLogger(SeverityInferenceService.class);
    private static final Pattern KTAS_PATTERN = Pattern.compile("KTAS[1-5]");

    private final RestClient.Builder restClientBuilder;
    private final GeminiProperties geminiProperties;

    public SeverityInferenceService(RestClient.Builder restClientBuilder, GeminiProperties geminiProperties) {
        this.restClientBuilder = restClientBuilder;
        this.geminiProperties = geminiProperties;
    }

    public AiSeverityResponse infer(AiSeverityRequest request) {
        if (geminiConfigured()) {
            try {
                String answer = requestGeminiSeverity(request);
                String severityLevel = extractSeverity(answer);
                if (severityLevel != null) {
                    return new AiSeverityResponse(severityLevel, "AI");
                }
            } catch (Exception exception) {
                log.warn("Gemini 중증도 추론에 실패해 보수적 fallback으로 대체합니다.", exception);
            }
        }

        return new AiSeverityResponse(fallbackSeverity(request), "FALLBACK");
    }

    private boolean geminiConfigured() {
        return geminiProperties.isEnabled()
                && geminiProperties.getApiKey() != null
                && !geminiProperties.getApiKey().isBlank();
    }

    private String requestGeminiSeverity(AiSeverityRequest request) {
        GeminiGenerateResponse response = restClientBuilder
                .baseUrl(geminiProperties.getBaseUrl())
                .build()
                .post()
                .uri(uriBuilder -> uriBuilder
                        .path("/v1beta/models/{model}:generateContent")
                        .queryParam("key", geminiProperties.getApiKey())
                        .build(geminiProperties.getModel()))
                .contentType(MediaType.APPLICATION_JSON)
                .body(buildGeminiRequest(request))
                .retrieve()
                .body(GeminiGenerateResponse.class);

        String answer = extractAnswer(response);
        if (answer == null || answer.isBlank()) {
            throw new IllegalStateException("Gemini severity response was empty");
        }

        return answer.trim();
    }

    private GeminiGenerateRequest buildGeminiRequest(AiSeverityRequest request) {
        String userPrompt = """
                아래 환자 정보만 참고해서 KTAS 중증도를 보수적으로 추정하세요.
                정보가 부족하더라도 가장 그럴듯한 단계 하나를 선택하되 과소분류하지 마세요.

                증상: %s
                나이: %s
                혈압: %s
                심박수: %s
                체온: %s
                산소포화도: %s

                반드시 KTAS1, KTAS2, KTAS3, KTAS4, KTAS5 중 하나만 출력하세요.
                다른 문장, 설명, 마침표, JSON은 절대 출력하지 마세요.
                """
                .formatted(
                        request.symptomText(),
                        formatValue(request.age()),
                        formatValue(request.bloodPressure()),
                        formatValue(request.heartRate()),
                        formatValue(request.temperature()),
                        formatValue(request.oxygenSaturation())
                );

        return new GeminiGenerateRequest(
                new GeminiContent(null, List.of(new GeminiPart(userPrompt))),
                new GeminiContent(null, List.of(new GeminiPart("""
                        당신은 응급실 의사결정 보조 시스템의 중증도 분류 보조기입니다.
                        제한된 텍스트와 활력징후만 보고 보수적으로 KTAS 단계를 추정해야 합니다.
                        출력은 KTAS1~KTAS5 중 하나만 허용됩니다.
                        """))),
                new GeminiGenerationConfig(
                        0.0,
                        16,
                        new GeminiThinkingConfig(0)
                )
        );
    }

    private String fallbackSeverity(AiSeverityRequest request) {
        if (request.oxygenSaturation() != null && request.oxygenSaturation() < 90) {
            return "KTAS1";
        }

        if (request.heartRate() != null && (request.heartRate() < 45 || request.heartRate() > 140)) {
            return "KTAS2";
        }

        Integer systolicPressure = extractSystolicPressure(request.bloodPressure());
        if (systolicPressure != null && systolicPressure < 90) {
            return "KTAS2";
        }

        if (request.temperature() != null && request.temperature() >= 39.5) {
            return "KTAS3";
        }

        if (request.age() != null && request.age() >= 75) {
            return "KTAS3";
        }

        return "KTAS3";
    }

    private Integer extractSystolicPressure(String bloodPressure) {
        if (bloodPressure == null || bloodPressure.isBlank()) {
            return null;
        }

        String[] parts = bloodPressure.split("/");
        if (parts.length == 0) {
            return null;
        }

        try {
            return Integer.parseInt(parts[0].trim());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private String extractSeverity(String answer) {
        if (answer == null) {
            return null;
        }

        Matcher matcher = KTAS_PATTERN.matcher(answer.toUpperCase());
        return matcher.find() ? matcher.group() : null;
    }

    private String extractAnswer(GeminiGenerateResponse response) {
        if (response == null || response.candidates() == null || response.candidates().isEmpty()) {
            return null;
        }

        GeminiCandidate candidate = response.candidates().getFirst();
        if (candidate == null || candidate.content() == null || candidate.content().parts() == null) {
            return null;
        }

        return candidate.content().parts().stream()
                .map(GeminiPart::text)
                .filter(text -> text != null && !text.isBlank())
                .reduce((left, right) -> left + "\n" + right)
                .orElse(null);
    }

    private String formatValue(Object value) {
        return value == null ? "미입력" : value.toString();
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private record GeminiGenerateRequest(
            GeminiContent contents,
            GeminiContent systemInstruction,
            GeminiGenerationConfig generationConfig
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private record GeminiContent(
            String role,
            List<GeminiPart> parts
    ) {
    }

    private record GeminiPart(String text) {
    }

    private record GeminiGenerationConfig(
            double temperature,
            int maxOutputTokens,
            GeminiThinkingConfig thinkingConfig
    ) {
    }

    private record GeminiThinkingConfig(
            int thinkingBudget
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private record GeminiGenerateResponse(List<GeminiCandidate> candidates) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private record GeminiCandidate(GeminiContent content) {
    }
}
