package com.supersave.backend.ai.service;

import com.supersave.backend.ai.dto.AiGuideRequest;
import com.supersave.backend.ai.dto.AiGuideResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AiGuideService {

    public AiGuideResponse guide(AiGuideRequest request) {
        // TODO: Replace template output with Gemini API integration plus safety prompts.
        String severityTone = switch (request.severityLevel()) {
            case "KTAS1", "KTAS2" -> "고위험 신호 가능성이 있어 신속한 이송 우선순위가 높습니다.";
            case "KTAS3" -> "중등도 응급 가능성이 있어 병원 비교와 이동시간을 함께 확인해야 합니다.";
            default -> "경증일 수 있지만 증상 변화 여부를 계속 관찰해야 합니다.";
        };

        String answer = (request.userQuestion() == null || request.userQuestion().isBlank())
                ? "현재 입력 기준으로는 가까운 병원과 수용 가능 병원을 함께 비교하는 것이 좋습니다."
                : "질문 \"" + request.userQuestion() + "\" 에 대해 MVP 단계에서는 템플릿 응답을 제공하며, 이후 Gemini 연동 시 자연어 질의응답을 고도화할 예정입니다.";

        return new AiGuideResponse(
                "이 응답은 의료 진단이 아니라 응급 의사결정 보조용 참고 정보입니다. 상태가 악화되면 즉시 119 또는 응급의료기관에 연락하세요.",
                "입력 증상: " + request.symptomText() + " / 중증도 참고: " + request.severityLevel(),
                severityTone,
                List.of("의식, 호흡, 출혈 여부를 먼저 확인하세요.", "이동 중 증상 변화가 있으면 즉시 구급 인력 또는 응급실에 알리세요.", "복용 약물과 기저질환 정보를 준비하세요."),
                answer
        );
    }
}
