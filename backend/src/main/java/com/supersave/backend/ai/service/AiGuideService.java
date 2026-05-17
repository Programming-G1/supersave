package com.supersave.backend.ai.service;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.supersave.backend.ai.config.GeminiProperties;
import com.supersave.backend.ai.dto.AiGuideRequest;
import com.supersave.backend.ai.dto.AiGuideResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;

@Service
public class AiGuideService {

    private static final Logger log = LoggerFactory.getLogger(AiGuideService.class);
    private static final String SAFETY_DISCLAIMER = "이 응답은 의료 진단이 아니라 응급 의사결정 보조용 참고 정보입니다. 상태가 악화되면 즉시 119 또는 응급의료기관에 연락하세요.";

    private final RestClient.Builder restClientBuilder;
    private final GeminiProperties geminiProperties;

    public AiGuideService(RestClient.Builder restClientBuilder, GeminiProperties geminiProperties) {
        this.restClientBuilder = restClientBuilder;
        this.geminiProperties = geminiProperties;
    }

    public AiGuideResponse guide(AiGuideRequest request) {
        String severityTone = switch (request.severityLevel()) {
            case "KTAS1", "KTAS2" -> "고위험 신호 가능성이 있어 신속한 이송 우선순위가 높습니다.";
            case "KTAS3" -> "중등도 응급 가능성이 있어 병원 비교와 이동시간을 함께 확인해야 합니다.";
            default -> "경증일 수 있지만 증상 변화 여부를 계속 관찰해야 합니다.";
        };

        return new AiGuideResponse(
                SAFETY_DISCLAIMER,
                "입력 증상: " + request.symptomText() + " / 중증도 참고: " + request.severityLevel(),
                severityTone,
                List.of(
                        "의식, 호흡, 출혈 여부를 먼저 확인하세요.",
                        "이동 중 증상 변화가 있으면 즉시 구급 인력 또는 응급실에 알리세요.",
                        "복용 약물과 기저질환 정보를 준비하세요."
                ),
                resolveAnswer(request, severityTone)
        );
    }

    private String resolveAnswer(AiGuideRequest request, String severityTone) {
        if (!geminiConfigured()) {
            return templateAnswer(request);
        }

        try {
            GeminiGenerateResponse response = restClientBuilder
                    .baseUrl(geminiProperties.getBaseUrl())
                    .build()
                    .post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1beta/models/{model}:generateContent")
                            .queryParam("key", geminiProperties.getApiKey())
                            .build(geminiProperties.getModel()))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(buildGeminiRequest(request, severityTone))
                    .retrieve()
                    .body(GeminiGenerateResponse.class);

            String answer = extractAnswer(response);
            return answer == null || answer.isBlank() ? templateAnswer(request) : answer.trim();
        } catch (Exception exception) {
            log.warn("Gemini API 호출에 실패해 템플릿 응답으로 대체합니다.", exception);
            return templateAnswer(request);
        }
    }

    private boolean geminiConfigured() {
        return geminiProperties.isEnabled()
                && geminiProperties.getApiKey() != null
                && !geminiProperties.getApiKey().isBlank();
    }

    private GeminiGenerateRequest buildGeminiRequest(AiGuideRequest request, String severityTone) {
        String question = (request.userQuestion() == null || request.userQuestion().isBlank())
                ? "현재 상황에서 우선 확인할 점과 이동 중 유의할 점을 설명해 주세요."
                : request.userQuestion();

        String userPrompt = """
                증상: %s
                중증도: %s
                참고 판단: %s
                사용자 질문: %s

                위 정보를 바탕으로 한국어로 4문장 이내로 답변하세요.
                입력이 인사, 자기소개 요청, 잡담처럼 응급 증상이 아닌 경우에는 KTAS나 질환을 판단하지 말고 SuperSave AI 도우미라고 소개한 뒤 증상, 나이, 기저질환, 현재 위치 등 필요한 정보를 질문하세요.
                중증도는 참고값일 뿐이라고 표현하고, 입력만으로 KTAS 단계를 확정하지 마세요.
                의료 진단처럼 단정하지 말고, 응급 의사결정 보조용 안내만 제공하세요.
                상태 악화 시 119 또는 응급실에 즉시 연락해야 한다는 취지의 안내를 포함하세요.
                """
                .formatted(request.symptomText(), request.severityLevel(), severityTone, question);

        return new GeminiGenerateRequest(
                new GeminiContent(null, List.of(new GeminiPart(userPrompt))),
                new GeminiContent(null, List.of(new GeminiPart("""
                        당신은 응급실 의사결정 보조 시스템의 AI 가이드입니다.
                        인사나 일반 질문에는 응급 환자처럼 분류하지 말고 자연스럽게 응답하세요.
                        의료 진단이나 확정적 처방은 하지 말고, 한국어로 짧고 분명하게 답변하세요.
                        과도한 추측은 피하고 입력 정보 범위 안에서만 설명하세요.
                        """))),
                new GeminiGenerationConfig(
                        geminiProperties.getTemperature(),
                        geminiProperties.getMaxOutputTokens(),
                        new GeminiThinkingConfig(0)
                )
        );
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

    private String templateAnswer(AiGuideRequest request) {
        return (request.userQuestion() == null || request.userQuestion().isBlank())
                ? "현재 입력 기준으로는 가까운 병원과 수용 가능 병원을 함께 비교하는 것이 좋습니다."
                : "질문 \"" + request.userQuestion() + "\" 에 대해 현재는 기본 가이드 응답을 제공하며, Gemini 연동 시 더 정교한 자연어 응답으로 확장됩니다.";
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
