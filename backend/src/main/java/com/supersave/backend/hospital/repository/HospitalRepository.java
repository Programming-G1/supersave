package com.supersave.backend.hospital.repository;

import com.supersave.backend.hospital.entity.Hospital;

import java.util.List;
import java.util.Optional;

public interface HospitalRepository {

    List<Hospital> findAll();

    Optional<Hospital> findById(Long id);

    Hospital save(Hospital hospital);

    Hospital registerIncomingPatient(Long id);
}
