package com.supersave.backend.departure.service;

import com.supersave.backend.departure.dto.DepartureRequest;
import com.supersave.backend.departure.dto.DepartureResponse;
import com.supersave.backend.departure.entity.DepartureRegistration;
import com.supersave.backend.departure.repository.DepartureRepository;
import com.supersave.backend.hospital.entity.Hospital;
import com.supersave.backend.hospital.repository.HospitalRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class DepartureService {

    private final DepartureRepository departureRepository;
    private final HospitalRepository hospitalRepository;

    public DepartureService(DepartureRepository departureRepository, HospitalRepository hospitalRepository) {
        this.departureRepository = departureRepository;
        this.hospitalRepository = hospitalRepository;
    }

    public DepartureResponse register(DepartureRequest request) {
        Hospital hospital = hospitalRepository.registerIncomingPatient(request.hospitalId());
        int etaMinutes = request.etaMinutes() == null ? Math.max(5, hospital.estimatedWaitTimeMinutes() / 4) : request.etaMinutes();

        DepartureRegistration saved = departureRepository.save(new DepartureRegistration(
                null, hospital.id(), request.userLatitude(), request.userLongitude(), etaMinutes,
                request.severityLevel(), request.symptomSummary(), LocalDateTime.now()
        ));

        return new DepartureResponse(
                saved.id(),
                hospital.id(),
                hospital.name(),
                etaMinutes,
                hospital.currentPatients() + hospital.incomingPatients(),
                hospital.estimatedWaitTimeMinutes(),
                "도착 예정 등록이 반영되었습니다. 실제 수용 여부는 병원 상황에 따라 달라질 수 있습니다.",
                saved.createdAt()
        );
    }
}
