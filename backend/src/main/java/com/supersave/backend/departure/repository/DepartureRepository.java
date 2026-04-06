package com.supersave.backend.departure.repository;

import com.supersave.backend.departure.entity.DepartureRegistration;

import java.util.List;

public interface DepartureRepository {

    DepartureRegistration save(DepartureRegistration registration);

    List<DepartureRegistration> findByHospitalId(Long hospitalId);
}
