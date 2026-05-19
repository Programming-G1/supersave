package com.supersave.backend.recommendation.service;

import com.supersave.backend.hospital.entity.Hospital;
import com.supersave.backend.hospital.repository.HospitalRepository;
import com.supersave.backend.recommendation.dto.RecommendationRequest;
import com.supersave.backend.recommendation.dto.RecommendationResultResponse;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class RecommendationService {

    private final HospitalRepository hospitalRepository;

    public RecommendationService(HospitalRepository hospitalRepository) {
        this.hospitalRepository = hospitalRepository;
    }

    public List<RecommendationResultResponse> recommend(RecommendationRequest request) {
        return hospitalRepository.findAll().stream()
                .map(hospital -> toResult(hospital, request))
                .sorted(Comparator.comparingDouble(RecommendationResultResponse::score).reversed())
                .toList();
    }

    RecommendationResultResponse toResult(Hospital hospital, RecommendationRequest request) {
        double distanceKm = haversineKm(request.latitude(), request.longitude(), hospital.latitude(), hospital.longitude());
        int etaMinutes = Math.max(4, (int) Math.round(distanceKm * 3.2));
        int waitMinutes = (int) Math.round(
                ((hospital.currentPatients() + hospital.incomingPatients()) / Math.max(hospital.processingRatePerHour(), 1.0)) * 60.0
        );
        int totalEstimatedMinutes = etaMinutes + waitMinutes;

        boolean severitySupported = hospital.severityLevels().contains(request.severityLevel());
        double rawScore = (severitySupported ? 34.0 : 10.0)
                + Math.min((hospital.availableBeds() + hospital.intensiveCareBeds() + hospital.surgeryBeds()) * 3.0, 28.0)
                + Math.max(0.0, 38.0 - (totalEstimatedMinutes / 2.5))
                + symptomBonus(hospital, request.symptomSummary());
        double score = clampScore(rawScore);

        return new RecommendationResultResponse(
                hospital.id(),
                hospital.name(),
                Math.round(score * 10.0) / 10.0,
                Math.round(distanceKm * 10.0) / 10.0,
                etaMinutes,
                waitMinutes,
                totalEstimatedMinutes,
                hospital.availableBeds(),
                hospital.intensiveCareBeds(),
                hospital.surgeryBeds(),
                (severitySupported ? "선택한 중증도 대응 가능" : "중증도 대응은 제한적")
                        + " / 예상 이동 " + etaMinutes + "분 / 예상 대기 " + waitMinutes + "분"
                        + " / 총 소요 " + totalEstimatedMinutes + "분"
        );
    }

    private double symptomBonus(Hospital hospital, String symptomSummary) {
        if (symptomSummary == null) {
            return 0.0;
        }
        if ((symptomSummary.contains("흉통") || symptomSummary.contains("심장")) && hospital.availableSpecialists().contains("심장내과")) {
            return 10.0;
        }
        if ((symptomSummary.contains("외상") || symptomSummary.contains("출혈")) && hospital.availableSpecialists().contains("외상외과")) {
            return 10.0;
        }
        if ((symptomSummary.contains("의식") || symptomSummary.contains("뇌")) && hospital.availableSpecialists().contains("신경외과")) {
            return 10.0;
        }
        return 0.0;
    }

    private double clampScore(double score) {
        return Math.max(0.0, Math.min(100.0, score));
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double deltaLat = Math.toRadians(lat2 - lat1);
        double deltaLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
        return 6371.0 * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    }
}
