package com.supersave.backend.ai.controller;

import com.supersave.backend.ai.dto.AiGuideRequest;
import com.supersave.backend.ai.dto.AiGuideResponse;
import com.supersave.backend.ai.service.AiGuideService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/guide")
public class AiGuideController {

    private final AiGuideService aiGuideService;

    public AiGuideController(AiGuideService aiGuideService) {
        this.aiGuideService = aiGuideService;
    }

    @PostMapping
    public AiGuideResponse guide(@Valid @RequestBody AiGuideRequest request) {
        return aiGuideService.guide(request);
    }
}
