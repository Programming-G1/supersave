package com.supersave.backend.departure.repository;

import com.supersave.backend.departure.entity.DepartureRegistration;
import com.supersave.backend.departure.entity.DepartureStatus;

import java.util.List;

public interface DepartureRepository {

    DepartureRegistration save(DepartureRegistration registration);

    List<DepartureRegistration> findByHospitalId(Long hospitalId);

    DepartureRegistration updateStatus(Long registrationId, DepartureStatus status);
}
