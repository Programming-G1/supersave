package com.supersave.backend.emergency;

import com.supersave.backend.emergency.EmergencyApiModels.AppDataResponse;
import com.supersave.backend.emergency.EmergencyApiModels.ArrivalStatusUpdate;
import com.supersave.backend.emergency.EmergencyApiModels.ArrivingPatient;
import com.supersave.backend.emergency.EmergencyApiModels.HealthResponse;
import com.supersave.backend.emergency.EmergencyApiModels.Hospital;
import com.supersave.backend.emergency.EmergencyApiModels.HospitalRecommendation;
import com.supersave.backend.emergency.EmergencyApiModels.RecommendationRequest;
import com.supersave.backend.emergency.EmergencyApiModels.TransferRequest;
import com.supersave.backend.emergency.EmergencyApiModels.TransferResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api")
public class EmergencyController {

    private final EmergencyDataService emergencyDataService;

    public EmergencyController(EmergencyDataService emergencyDataService) {
        this.emergencyDataService = emergencyDataService;
    }

    @GetMapping("/health")
    public HealthResponse health() {
        return new HealthResponse("UP", OffsetDateTime.now().toString());
    }

    @GetMapping("/app-data")
    public AppDataResponse appData() {
        return emergencyDataService.getAppData();
    }

    @GetMapping("/hospitals")
    public List<Hospital> hospitals() {
        return emergencyDataService.getHospitals();
    }

    @GetMapping("/hospitals/{hospitalId}")
    public Hospital hospital(@PathVariable String hospitalId) {
        return emergencyDataService.getHospital(hospitalId);
    }

    @GetMapping("/hospitals/{hospitalId}/arrivals")
    public List<ArrivingPatient> arrivals(@PathVariable String hospitalId) {
        return emergencyDataService.getArrivals(hospitalId);
    }

    @PostMapping("/recommendations")
    public List<HospitalRecommendation> recommendations(@Valid @RequestBody RecommendationRequest request) {
        return emergencyDataService.recommend(request);
    }

    @PostMapping("/transfers")
    public TransferResponse transfers(@Valid @RequestBody TransferRequest request) {
        return emergencyDataService.createTransfer(request);
    }

    @PatchMapping("/arrivals/{arrivalId}")
    public ArrivingPatient updateArrivalStatus(
            @PathVariable String arrivalId,
            @Valid @RequestBody ArrivalStatusUpdate update
    ) {
        return emergencyDataService.updateArrivalStatus(arrivalId, update);
    }
}
