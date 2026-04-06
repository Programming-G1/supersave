package com.supersave.backend.hospital.dto;

import com.supersave.backend.hospital.entity.Hospital;

import java.util.List;

public record HospitalSummaryResponse(
        Long id,
        String name,
        String address,
        String phone,
        double latitude,
        double longitude,
        int availableBeds,
        List<String> severityLevels,
        List<String> availableSpecialists,
        int currentPatients,
        int incomingPatients,
        int estimatedWaitTimeMinutes,
        String region
) {
    public static HospitalSummaryResponse from(Hospital hospital) {
        return new HospitalSummaryResponse(
                hospital.id(), hospital.name(), hospital.address(), hospital.phone(),
                hospital.latitude(), hospital.longitude(), hospital.availableBeds(),
                hospital.severityLevels(), hospital.availableSpecialists(), hospital.currentPatients(),
                hospital.incomingPatients(), hospital.estimatedWaitTimeMinutes(), hospital.region()
        );
    }
}
