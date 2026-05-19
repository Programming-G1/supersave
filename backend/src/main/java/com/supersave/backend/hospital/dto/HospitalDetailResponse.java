package com.supersave.backend.hospital.dto;

import com.supersave.backend.hospital.entity.Hospital;

import java.util.List;

public record HospitalDetailResponse(
        Long id,
        String name,
        String address,
        String phone,
        double latitude,
        double longitude,
        int availableBeds,
        int intensiveCareBeds,
        int surgeryBeds,
        List<String> severityLevels,
        List<String> availableSpecialists,
        List<String> departments,
        List<String> equipmentStatus,
        int currentPatients,
        int incomingPatients,
        double processingRatePerHour,
        int estimatedWaitTimeMinutes,
        String region
) {
    public static HospitalDetailResponse from(Hospital hospital) {
        return new HospitalDetailResponse(
                hospital.id(), hospital.name(), hospital.address(), hospital.phone(),
                hospital.latitude(), hospital.longitude(), hospital.availableBeds(),
                hospital.intensiveCareBeds(), hospital.surgeryBeds(),
                hospital.severityLevels(), hospital.availableSpecialists(), hospital.departments(),
                hospital.equipmentStatus(), hospital.currentPatients(), hospital.incomingPatients(),
                hospital.processingRatePerHour(), hospital.estimatedWaitTimeMinutes(), hospital.region()
        );
    }
}
