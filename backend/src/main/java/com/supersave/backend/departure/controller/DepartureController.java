package com.supersave.backend.departure.controller;

import com.supersave.backend.departure.dto.DepartureRequest;
import com.supersave.backend.departure.dto.DepartureResponse;
import com.supersave.backend.departure.service.DepartureService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/departures")
public class DepartureController {

    private final DepartureService departureService;

    public DepartureController(DepartureService departureService) {
        this.departureService = departureService;
    }

    @PostMapping
    public DepartureResponse register(@Valid @RequestBody DepartureRequest request) {
        return departureService.register(request);
    }
}
