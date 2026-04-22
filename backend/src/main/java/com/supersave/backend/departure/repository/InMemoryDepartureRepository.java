package com.supersave.backend.departure.repository;

import com.supersave.backend.departure.entity.DepartureRegistration;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@Repository
public class InMemoryDepartureRepository implements DepartureRepository {

    private final AtomicLong sequence = new AtomicLong(1);
    private final CopyOnWriteArrayList<DepartureRegistration> registrations = new CopyOnWriteArrayList<>();

    @Override
    public DepartureRegistration save(DepartureRegistration registration) {
        DepartureRegistration saved = new DepartureRegistration(
                sequence.getAndIncrement(),
                registration.hospitalId(),
                registration.userLatitude(),
                registration.userLongitude(),
                registration.etaMinutes(),
                registration.requesterType(),
                registration.severityLevel(),
                registration.symptomSummary(),
                registration.createdAt()
        );
        registrations.add(saved);
        return saved;
    }

    @Override
    public List<DepartureRegistration> findByHospitalId(Long hospitalId) {
        return registrations.stream().filter(registration -> registration.hospitalId().equals(hospitalId)).toList();
    }
}
