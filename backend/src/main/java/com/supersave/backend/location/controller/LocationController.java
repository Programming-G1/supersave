package com.supersave.backend.location.controller;

import com.supersave.backend.location.dto.LocationSearchResponse;
import com.supersave.backend.location.service.KakaoLocationService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/locations")
public class LocationController {

    private final KakaoLocationService kakaoLocationService;

    public LocationController(KakaoLocationService kakaoLocationService) {
        this.kakaoLocationService = kakaoLocationService;
    }

    @GetMapping("/search")
    public List<LocationSearchResponse> search(
            @RequestParam @NotBlank @Size(max = 100) String query
    ) {
        return kakaoLocationService.search(query);
    }
}
