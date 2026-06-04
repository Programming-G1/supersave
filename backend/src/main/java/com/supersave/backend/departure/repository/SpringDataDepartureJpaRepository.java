package com.supersave.backend.departure.repository;

import com.supersave.backend.departure.entity.DepartureRegistrationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpringDataDepartureJpaRepository extends JpaRepository<DepartureRegistrationEntity, Long> {

    List<DepartureRegistrationEntity> findByHospitalIdOrderByCreatedAtDesc(Long hospitalId);
}
