package com.supersave.backend.departure.repository;

import com.supersave.backend.common.exception.NotFoundException;
import com.supersave.backend.departure.entity.DepartureRegistration;
import com.supersave.backend.departure.entity.DepartureStatus;
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
                registration.createdAt(),
                registration.status()
        );
        registrations.add(saved);
        return saved;
    }

    @Override
    public List<DepartureRegistration> findByHospitalId(Long hospitalId) {
        return registrations.stream().filter(registration -> registration.hospitalId().equals(hospitalId)).toList();
    }

    @Override
    public DepartureRegistration updateStatus(Long registrationId, DepartureStatus status) {
        for (int index = 0; index < registrations.size(); index++) {
            DepartureRegistration current = registrations.get(index);
            if (!current.id().equals(registrationId)) {
                continue;
            }

            DepartureRegistration updated = new DepartureRegistration(
                    current.id(),
                    current.hospitalId(),
                    current.userLatitude(),
                    current.userLongitude(),
                    current.etaMinutes(),
                    current.requesterType(),
                    current.severityLevel(),
                    current.symptomSummary(),
                    current.createdAt(),
                    status
            );
            registrations.set(index, updated);
            return updated;
        }
        throw new NotFoundException("Departure registration " + registrationId + " was not found");
    }
}
