package com.supersave.backend.departure.service;

import com.supersave.backend.departure.dto.DepartureQueueItemResponse;
import com.supersave.backend.departure.entity.DepartureRegistration;
import com.supersave.backend.departure.entity.DepartureStatus;
import com.supersave.backend.departure.entity.RequesterType;
import com.supersave.backend.departure.repository.DepartureRepository;
import com.supersave.backend.hospital.entity.Hospital;
import com.supersave.backend.hospital.repository.HospitalRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class DepartureServiceTest {

    @Test
    void excludesCancelledRegistrationsFromHospitalQueue() {
        DepartureRepository departureRepository = new StubDepartureRepository(List.of(
                new DepartureRegistration(
                        1L,
                        1L,
                        37.5,
                        127.0,
                        10,
                        "홍길동",
                        RequesterType.PATIENT,
                        "KTAS3",
                        "복통",
                        LocalDateTime.of(2026, 6, 8, 12, 0),
                        DepartureStatus.CANCELLED
                ),
                new DepartureRegistration(
                        2L,
                        1L,
                        37.5,
                        127.0,
                        8,
                        "김영희",
                        RequesterType.GUARDIAN,
                        "KTAS2",
                        "흉통",
                        LocalDateTime.of(2026, 6, 8, 12, 5),
                        DepartureStatus.PENDING
                )
        ));

        HospitalRepository hospitalRepository = new StubHospitalRepository();
        DepartureService service = new DepartureService(departureRepository, hospitalRepository);

        List<DepartureQueueItemResponse> queue = service.findByHospitalId(1L);

        assertThat(queue).hasSize(1);
        assertThat(queue.getFirst().patientName()).isEqualTo("김영희");
        assertThat(queue.getFirst().status()).isEqualTo(DepartureStatus.PENDING);
    }

    private static final class StubDepartureRepository implements DepartureRepository {
        private final List<DepartureRegistration> registrations;

        private StubDepartureRepository(List<DepartureRegistration> registrations) {
            this.registrations = registrations;
        }

        @Override
        public DepartureRegistration save(DepartureRegistration registration) {
            throw new UnsupportedOperationException();
        }

        @Override
        public List<DepartureRegistration> findByHospitalId(Long hospitalId) {
            return registrations.stream()
                    .filter(registration -> registration.hospitalId().equals(hospitalId))
                    .toList();
        }

        @Override
        public DepartureRegistration updateStatus(Long registrationId, DepartureStatus status) {
            throw new UnsupportedOperationException();
        }
    }

    private static final class StubHospitalRepository implements HospitalRepository {
        private final Hospital hospital = new Hospital(
                1L,
                "테스트병원",
                "서울시 어딘가",
                "02-000-0000",
                37.5,
                127.0,
                10,
                2,
                1,
                List.of("KTAS1", "KTAS2", "KTAS3", "KTAS4", "KTAS5"),
                List.of("응급의학과"),
                List.of("응급의학과"),
                List.of(),
                5,
                1,
                6.0,
                30,
                "서울"
        );

        @Override
        public List<Hospital> findAll() {
            return List.of(hospital);
        }

        @Override
        public Optional<Hospital> findById(Long id) {
            return hospital.id().equals(id) ? Optional.of(hospital) : Optional.empty();
        }

        @Override
        public Hospital save(Hospital hospital) {
            throw new UnsupportedOperationException();
        }

        @Override
        public Hospital registerIncomingPatient(Long id) {
            throw new UnsupportedOperationException();
        }
    }
}
