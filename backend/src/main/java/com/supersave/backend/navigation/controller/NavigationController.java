package com.supersave.backend.navigation.controller;

import com.supersave.backend.navigation.dto.NavigationRouteResponse;
import com.supersave.backend.navigation.service.KakaoNavigationService;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/navigation")
public class NavigationController {

    private final KakaoNavigationService kakaoNavigationService;

    public NavigationController(KakaoNavigationService kakaoNavigationService) {
        this.kakaoNavigationService = kakaoNavigationService;
    }

    @GetMapping("/route")
    public NavigationRouteResponse route(
            @RequestParam @DecimalMin("-90.0") @DecimalMax("90.0") double originLat,
            @RequestParam @DecimalMin("-180.0") @DecimalMax("180.0") double originLng,
            @RequestParam @DecimalMin("-90.0") @DecimalMax("90.0") double destinationLat,
            @RequestParam @DecimalMin("-180.0") @DecimalMax("180.0") double destinationLng
    ) {
        return kakaoNavigationService.getRoute(originLat, originLng, destinationLat, destinationLng);
    }
}
