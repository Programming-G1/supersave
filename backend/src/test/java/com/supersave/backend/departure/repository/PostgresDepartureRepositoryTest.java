package com.supersave.backend.departure.repository;

import com.supersave.backend.departure.entity.DepartureRegistration;
import com.supersave.backend.departure.entity.DepartureStatus;
import com.supersave.backend.departure.entity.RequesterType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Import(PostgresDepartureRepository.class)
@ActiveProfiles("postgres")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:departures;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class PostgresDepartureRepositoryTest {

    @Autowired
    private PostgresDepartureRepository repository;

    @Test
    void savesAndUpdatesDepartureRegistrations() {
        DepartureRegistration saved = repository.save(new DepartureRegistration(
                null,
                1L,
                37.5665,
                126.9780,
                12,
                "홍길동",
                RequesterType.PATIENT,
                "KTAS3",
                "복통",
                LocalDateTime.of(2026, 6, 4, 12, 30),
                DepartureStatus.PENDING
        ));

        assertThat(saved.id()).isNotNull();

        List<DepartureRegistration> found = repository.findByHospitalId(1L);
        assertThat(found).hasSize(1);
        assertThat(found.getFirst().patientName()).isEqualTo("홍길동");

        DepartureRegistration updated = repository.updateStatus(saved.id(), DepartureStatus.CANCELLED);

        assertThat(updated.status()).isEqualTo(DepartureStatus.CANCELLED);
        assertThat(repository.findByHospitalId(1L).getFirst().status()).isEqualTo(DepartureStatus.CANCELLED);
    }
}
