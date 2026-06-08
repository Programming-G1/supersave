package com.supersave.backend.departure.service;

import com.supersave.backend.common.exception.NotFoundException;
import com.supersave.backend.departure.dto.DepartureQueueItemResponse;
import com.supersave.backend.departure.dto.DepartureRequest;
import com.supersave.backend.departure.dto.DepartureResponse;
import com.supersave.backend.departure.entity.DepartureRegistration;
import com.supersave.backend.departure.entity.DepartureStatus;
import com.supersave.backend.departure.repository.DepartureRepository;
import com.supersave.backend.hospital.entity.Hospital;
import com.supersave.backend.hospital.repository.HospitalRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

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
                request.patientName(), request.requesterType(), request.severityLevel(), request.symptomSummary(), LocalDateTime.now(), DepartureStatus.PENDING
        ));

        return new DepartureResponse(
                saved.id(),
                hospital.id(),
                hospital.name(),
                saved.patientName(),
                saved.requesterType(),
                etaMinutes,
                hospital.currentPatients() + hospital.incomingPatients(),
                hospital.estimatedWaitTimeMinutes(),
                "도착 예정 등록이 반영되었습니다. 실제 수용 여부는 병원 상황에 따라 달라질 수 있습니다.",
                saved.createdAt()
        );
    }

    public List<DepartureQueueItemResponse> findByHospitalId(Long hospitalId) {
        return departureRepository.findByHospitalId(hospitalId).stream()
                .filter(registration -> registration.status() != DepartureStatus.CANCELLED)
                .sorted(Comparator.comparing(DepartureRegistration::createdAt).reversed())
                .map(this::toQueueItem)
                .toList();
    }

    public DepartureQueueItemResponse updateStatus(Long registrationId, DepartureStatus status) {
        return toQueueItem(departureRepository.updateStatus(registrationId, status));
    }

    private DepartureQueueItemResponse toQueueItem(DepartureRegistration registration) {
        Hospital hospital = hospitalRepository.findById(registration.hospitalId())
                .orElseThrow(() -> new NotFoundException("Hospital " + registration.hospitalId() + " was not found"));

        return new DepartureQueueItemResponse(
                registration.id(),
                hospital.id(),
                hospital.name(),
                registration.patientName(),
                registration.requesterType(),
                registration.etaMinutes(),
                registration.severityLevel(),
                registration.symptomSummary(),
                registration.createdAt(),
                registration.status()
        );
    }
}
