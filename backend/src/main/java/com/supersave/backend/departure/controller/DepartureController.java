package com.supersave.backend.departure.controller;

import com.supersave.backend.departure.dto.DepartureQueueItemResponse;
import com.supersave.backend.departure.dto.DepartureRequest;
import com.supersave.backend.departure.dto.DepartureResponse;
import com.supersave.backend.departure.dto.DepartureStatusUpdateRequest;
import com.supersave.backend.departure.service.DepartureService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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

    @GetMapping
    public List<DepartureQueueItemResponse> findByHospital(@RequestParam Long hospitalId) {
        return departureService.findByHospitalId(hospitalId);
    }

    @PostMapping("/{registrationId}/status")
    public DepartureQueueItemResponse updateStatus(
            @PathVariable Long registrationId,
            @Valid @RequestBody DepartureStatusUpdateRequest request
    ) {
        return departureService.updateStatus(registrationId, request.status());
    }
}
