package com.supersave.backend.ai.service;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.supersave.backend.ai.config.GeminiProperties;
import com.supersave.backend.ai.dto.AiTriageRequest;
import com.supersave.backend.ai.dto.AiTriageResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class AiTriageService {

    private static final Logger log = LoggerFactory.getLogger(AiTriageService.class);
    private static final List<String> VALID_SEVERITIES = List.of("KTAS1", "KTAS2", "KTAS3", "KTAS4", "KTAS5");

    private final RestClient.Builder restClientBuilder;
    private final GeminiProperties geminiProperties;
    private final ObjectMapper objectMapper;

    public AiTriageService(
            RestClient.Builder restClientBuilder,
            GeminiProperties geminiProperties,
            ObjectMapper objectMapper
    ) {
        this.restClientBuilder = restClientBuilder;
        this.geminiProperties = geminiProperties;
        this.objectMapper = objectMapper;
    }

    public AiTriageResponse triage(AiTriageRequest request) {
        if (!geminiConfigured()) {
            return fallbackTriage(request, false);
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
                    .body(buildGeminiRequest(request))
                    .retrieve()
                    .body(GeminiGenerateResponse.class);

            AiTriageResponse parsed = parseGeminiAnswer(extractAnswer(response));
            if (parsed != null && VALID_SEVERITIES.contains(parsed.severityLevel())) {
                return parsed;
            }
        } catch (Exception exception) {
            log.warn("Gemini triage API 호출에 실패해 규칙 기반 중증도 추정으로 대체합니다.", exception);
        }

        return fallbackTriage(request, false);
    }

    private boolean geminiConfigured() {
        return geminiProperties.isEnabled()
                && geminiProperties.getApiKey() != null
                && !geminiProperties.getApiKey().isBlank();
    }

    private GeminiGenerateRequest buildGeminiRequest(AiTriageRequest request) {
        String userPrompt = """
                환자 입력:
                - 증상: %s
                - 나이: %s
                - 성별: %s
                - 혈압: %s
                - 심박수: %s
                - 체온: %s
                - 산소포화도: %s

                위 입력만 근거로 응급실 이송 의사결정 보조용 KTAS 참고 단계를 추정하세요.
                의료 진단이나 확정 판정이 아니라 추천 로직에 넣을 참고 중증도입니다.
                "해당한다", "확정된다", "진단된다"처럼 확정 표현은 쓰지 말고 "가능성이 있어", "참고 단계로 추정"처럼 표현하세요.
                반드시 JSON 객체만 출력하세요. 마크다운 코드블록은 쓰지 마세요.

                JSON 스키마:
                {
                  "severityLevel": "KTAS1|KTAS2|KTAS3|KTAS4|KTAS5",
                  "summary": "증상 요약 한 문장",
                  "recommendedDepartments": ["응급의학과"],
                  "warningSigns": ["주의해야 할 악화 신호"],
                  "reasoning": "KTAS를 이렇게 추정한 이유 한 문장",
                  "aiUsed": true
                }
                """
                .formatted(
                        request.symptomText(),
                        valueOrUnknown(request.age()),
                        valueOrUnknown(request.gender()),
                        valueOrUnknown(request.bloodPressure()),
                        valueOrUnknown(request.heartRate()),
                        valueOrUnknown(request.temperature()),
                        valueOrUnknown(request.oxygenSaturation())
                );

        return new GeminiGenerateRequest(
                List.of(new GeminiContent(null, List.of(new GeminiPart(userPrompt)))),
                new GeminiContent(null, List.of(new GeminiPart("""
                        당신은 한국 응급의료 서비스의 KTAS 참고 분류를 돕는 보조 AI입니다.
                        입력 정보가 부족하면 과도하게 단정하지 말고 보수적으로 판단하세요.
                        생명 위협 가능성이 있는 의식저하, 호흡곤란, 흉통, 대량출혈, 쇼크, 산소포화도 저하는 높은 중증도로 봅니다.
                        severityLevel은 KTAS 참고 단계이며, reasoning에는 확정 진단 표현을 쓰지 마세요.
                        결과는 반드시 한국어 JSON만 출력하세요.
                        """))),
                new GeminiGenerationConfig(
                        geminiProperties.getTemperature(),
                        geminiProperties.getMaxOutputTokens(),
                        new GeminiThinkingConfig(0)
                )
        );
    }

    private AiTriageResponse parseGeminiAnswer(String answer) {
        if (answer == null || answer.isBlank()) {
            return null;
        }

        String json = extractJsonObject(answer);
        if (json == null) {
            return null;
        }

        try {
            GeminiTriagePayload payload = objectMapper.readValue(json, GeminiTriagePayload.class);
            String severity = normalizeSeverity(payload.severityLevel());
            if (!VALID_SEVERITIES.contains(severity)) {
                return null;
            }

            return new AiTriageResponse(
                    severity,
                    defaultText(payload.summary(), "입력된 증상을 바탕으로 중증도를 추정했습니다."),
                    defaultList(payload.recommendedDepartments(), List.of("응급의학과")),
                    defaultList(payload.warningSigns(), List.of("의식 변화", "호흡 악화", "통증 악화")),
                    defaultText(payload.reasoning(), "Gemini가 증상과 활력징후를 함께 고려해 추정했습니다."),
                    true
            );
        } catch (Exception exception) {
            log.warn("Gemini triage JSON 파싱에 실패했습니다. answer={}", answer, exception);
            return null;
        }
    }

    private AiTriageResponse fallbackTriage(AiTriageRequest request, boolean aiUsed) {
        String symptom = request.symptomText() == null ? "" : request.symptomText().toLowerCase(Locale.ROOT);
        String severity = "KTAS3";

        if (containsAny(symptom, "의식", "경련", "쇼크", "심정지", "호흡없", "대량출혈")) {
            severity = "KTAS1";
        } else if (containsAny(symptom, "흉통", "가슴", "호흡곤란", "숨", "뇌졸중", "마비", "실신")) {
            severity = "KTAS2";
        } else if (containsAny(symptom, "복통", "외상", "골절", "출혈", "화상")) {
            severity = "KTAS3";
        } else if (containsAny(symptom, "발열", "두통", "구토", "어지러움")) {
            severity = "KTAS4";
        } else {
            severity = "KTAS5";
        }

        if (request.oxygenSaturation() != null && request.oxygenSaturation() < 90) {
            severity = "KTAS1";
        } else if (request.oxygenSaturation() != null && request.oxygenSaturation() < 94) {
            severity = moreSevere(severity, "KTAS2");
        }
        if (request.heartRate() != null && (request.heartRate() < 50 || request.heartRate() > 130)) {
            severity = moreSevere(severity, "KTAS2");
        }
        if (request.temperature() != null && request.temperature() >= 39.0) {
            severity = moreSevere(severity, "KTAS3");
        }

        return new AiTriageResponse(
                severity,
                request.symptomText(),
                inferDepartments(symptom),
                inferWarnings(severity),
                aiUsed
                        ? "AI 응답을 바탕으로 중증도를 추정했습니다."
                        : "Gemini 사용이 불가능해 증상 키워드와 활력징후 기반 규칙으로 추정했습니다.",
                aiUsed
        );
    }

    private List<String> inferDepartments(String symptom) {
        List<String> departments = new ArrayList<>();
        departments.add("응급의학과");
        if (containsAny(symptom, "흉통", "가슴", "심장")) {
            departments.add("심장내과");
        }
        if (containsAny(symptom, "호흡곤란", "숨")) {
            departments.add("호흡기내과");
        }
        if (containsAny(symptom, "의식", "뇌", "마비", "경련")) {
            departments.add("신경외과");
        }
        if (containsAny(symptom, "외상", "골절", "출혈")) {
            departments.add("외상외과");
        }
        return departments;
    }

    private List<String> inferWarnings(String severity) {
        return switch (severity) {
            case "KTAS1", "KTAS2" -> List.of("의식 저하", "호흡 악화", "흉통 지속", "대량 출혈");
            case "KTAS3" -> List.of("통증 증가", "발열 악화", "호흡 불편 발생");
            default -> List.of("증상 지속", "통증 증가", "새로운 신경학적 증상 발생");
        };
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

    private String extractJsonObject(String answer) {
        int start = answer.indexOf('{');
        int end = answer.lastIndexOf('}');
        if (start < 0 || end <= start) {
            return null;
        }
        return answer.substring(start, end + 1);
    }

    private boolean containsAny(String source, String... keywords) {
        for (String keyword : keywords) {
            if (source.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private String moreSevere(String current, String candidate) {
        return severityRank(candidate) < severityRank(current) ? candidate : current;
    }

    private int severityRank(String severity) {
        return switch (severity) {
            case "KTAS1" -> 1;
            case "KTAS2" -> 2;
            case "KTAS3" -> 3;
            case "KTAS4" -> 4;
            default -> 5;
        };
    }

    private String normalizeSeverity(String severity) {
        if (severity == null) {
            return "";
        }
        return severity.replace(" ", "").toUpperCase(Locale.ROOT);
    }

    private Object valueOrUnknown(Object value) {
        return value == null || value.toString().isBlank() ? "정보 없음" : value;
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private List<String> defaultList(List<String> value, List<String> fallback) {
        return value == null || value.isEmpty() ? fallback : value;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private record GeminiGenerateRequest(
            List<GeminiContent> contents,
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

    private record GeminiThinkingConfig(int thinkingBudget) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private record GeminiGenerateResponse(List<GeminiCandidate> candidates) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private record GeminiCandidate(GeminiContent content) {
    }

    private record GeminiTriagePayload(
            String severityLevel,
            String summary,
            List<String> recommendedDepartments,
            List<String> warningSigns,
            String reasoning,
            Boolean aiUsed
    ) {
    }
}
