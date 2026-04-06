package com.supersave.backend.hospital.controller;

import com.supersave.backend.hospital.dto.HospitalDetailResponse;
import com.supersave.backend.hospital.dto.HospitalSummaryResponse;
import com.supersave.backend.hospital.service.HospitalService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/hospitals")
public class HospitalController {

    private final HospitalService hospitalService;

    public HospitalController(HospitalService hospitalService) {
        this.hospitalService = hospitalService;
    }

    @GetMapping
    public List<HospitalSummaryResponse> getHospitals() {
        return hospitalService.getHospitals();
    }

    @GetMapping("/{id}")
    public HospitalDetailResponse getHospital(@PathVariable Long id) {
        return hospitalService.getHospital(id);
    }
}
