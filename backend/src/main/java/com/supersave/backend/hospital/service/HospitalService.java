package com.supersave.backend.hospital.service;

import com.supersave.backend.common.exception.NotFoundException;
import com.supersave.backend.hospital.dto.HospitalDetailResponse;
import com.supersave.backend.hospital.dto.HospitalSummaryResponse;
import com.supersave.backend.hospital.entity.Hospital;
import com.supersave.backend.hospital.repository.HospitalRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HospitalService {

    private final HospitalRepository hospitalRepository;

    public HospitalService(HospitalRepository hospitalRepository) {
        this.hospitalRepository = hospitalRepository;
    }

    public List<HospitalSummaryResponse> getHospitals() {
        return hospitalRepository.findAll().stream().map(HospitalSummaryResponse::from).toList();
    }

    public HospitalDetailResponse getHospital(Long id) {
        return HospitalDetailResponse.from(getHospitalEntity(id));
    }

    public Hospital getHospitalEntity(Long id) {
        return hospitalRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Hospital " + id + " was not found"));
    }
}
