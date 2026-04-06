package com.supersave.backend.hospital.entity;

import java.util.List;

public record Hospital(
        Long id,
        String name,
        String address,
        String phone,
        double latitude,
        double longitude,
        int availableBeds,
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
    public Hospital incrementIncomingPatients() {
        int nextIncoming = incomingPatients + 1;
        int nextWait = (int) Math.round(
                ((currentPatients + nextIncoming) / Math.max(processingRatePerHour, 1.0)) * 60.0
        );
        return new Hospital(
                id, name, address, phone, latitude, longitude, availableBeds, severityLevels,
                availableSpecialists, departments, equipmentStatus, currentPatients, nextIncoming,
                processingRatePerHour, nextWait, region
        );
    }
}
