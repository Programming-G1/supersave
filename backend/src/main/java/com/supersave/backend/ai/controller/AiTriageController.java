package com.supersave.backend.ai.controller;

import com.supersave.backend.ai.dto.AiTriageRequest;
import com.supersave.backend.ai.dto.AiTriageResponse;
import com.supersave.backend.ai.service.AiTriageService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/triage")
public class AiTriageController {

    private final AiTriageService aiTriageService;

    public AiTriageController(AiTriageService aiTriageService) {
        this.aiTriageService = aiTriageService;
    }

    @PostMapping
    public AiTriageResponse triage(@Valid @RequestBody AiTriageRequest request) {
        return aiTriageService.triage(request);
    }
}
