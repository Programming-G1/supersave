package com.supersave.backend.ai.controller;

import com.supersave.backend.ai.dto.AiSeverityRequest;
import com.supersave.backend.ai.dto.AiSeverityResponse;
import com.supersave.backend.ai.service.SeverityInferenceService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/severity")
public class AiSeverityController {

    private final SeverityInferenceService severityInferenceService;

    public AiSeverityController(SeverityInferenceService severityInferenceService) {
        this.severityInferenceService = severityInferenceService;
    }

    @PostMapping
    public AiSeverityResponse infer(@Valid @RequestBody AiSeverityRequest request) {
        return severityInferenceService.infer(request);
    }
}
