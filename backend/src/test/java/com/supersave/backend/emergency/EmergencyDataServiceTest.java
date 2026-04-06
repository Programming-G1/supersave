package com.supersave.backend.emergency;

import com.supersave.backend.emergency.EmergencyApiModels.Patient;
import com.supersave.backend.emergency.EmergencyApiModels.RecommendationRequest;
import com.supersave.backend.emergency.EmergencyApiModels.TransferRequest;
import com.supersave.backend.emergency.EmergencyApiModels.VitalSigns;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EmergencyDataServiceTest {

    private final EmergencyDataService emergencyDataService = new EmergencyDataService();

    @Test
    void recommendationsAreSortedByScore() {
        var recommendations = emergencyDataService.recommend(new RecommendationRequest(testPatient()));

        assertThat(recommendations).isNotEmpty();
        assertThat(recommendations.getFirst().score()).isGreaterThanOrEqualTo(recommendations.getLast().score());
    }

    @Test
    void creatingTransferAddsArrivalForSelectedHospital() {
        int before = emergencyDataService.getArrivals("h2").size();

        var transfer = emergencyDataService.createTransfer(new TransferRequest("h2", testPatient()));

        assertThat(transfer.hospitalId()).isEqualTo("h2");
        assertThat(transfer.arrival().status()).isEqualTo("pending");
        assertThat(emergencyDataService.getArrivals("h2")).hasSize(before + 1);
    }

    private Patient testPatient() {
        return new Patient(
                "pt-test",
                "테스트 환자",
                52,
                "male",
                "흉통과 호흡곤란",
                "KTAS2",
                new VitalSigns("130/80", 88, 36.8, 96)
        );
    }
}
