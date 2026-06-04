package com.supersave.backend.departure.repository;

import com.supersave.backend.common.exception.NotFoundException;
import com.supersave.backend.departure.entity.DepartureRegistration;
import com.supersave.backend.departure.entity.DepartureRegistrationEntity;
import com.supersave.backend.departure.entity.DepartureStatus;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
@Profile("postgres")
public class PostgresDepartureRepository implements DepartureRepository {

    private final SpringDataDepartureJpaRepository jpaRepository;

    public PostgresDepartureRepository(SpringDataDepartureJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    @Transactional
    public DepartureRegistration save(DepartureRegistration registration) {
        DepartureRegistrationEntity saved = jpaRepository.save(DepartureRegistrationEntity.fromDomain(registration));
        return saved.toDomain();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartureRegistration> findByHospitalId(Long hospitalId) {
        return jpaRepository.findByHospitalIdOrderByCreatedAtDesc(hospitalId).stream()
                .map(DepartureRegistrationEntity::toDomain)
                .toList();
    }

    @Override
    @Transactional
    public DepartureRegistration updateStatus(Long registrationId, DepartureStatus status) {
        DepartureRegistrationEntity registration = jpaRepository.findById(registrationId)
                .orElseThrow(() -> new NotFoundException("Departure registration " + registrationId + " was not found"));
        registration.setStatus(status);
        return registration.toDomain();
    }
}
