package com.supersave.backend.emergency;

import com.supersave.backend.emergency.EmergencyApiModels.AppDataResponse;
import com.supersave.backend.emergency.EmergencyApiModels.ArrivalStatusUpdate;
import com.supersave.backend.emergency.EmergencyApiModels.ArrivingPatient;
import com.supersave.backend.emergency.EmergencyApiModels.Beds;
import com.supersave.backend.emergency.EmergencyApiModels.CongestionPoint;
import com.supersave.backend.emergency.EmergencyApiModels.Coordinates;
import com.supersave.backend.emergency.EmergencyApiModels.Equipment;
import com.supersave.backend.emergency.EmergencyApiModels.Hospital;
import com.supersave.backend.emergency.EmergencyApiModels.HospitalRecommendation;
import com.supersave.backend.emergency.EmergencyApiModels.Patient;
import com.supersave.backend.emergency.EmergencyApiModels.RecommendationBreakdown;
import com.supersave.backend.emergency.EmergencyApiModels.RecommendationRequest;
import com.supersave.backend.emergency.EmergencyApiModels.Specialists;
import com.supersave.backend.emergency.EmergencyApiModels.TransferRequest;
import com.supersave.backend.emergency.EmergencyApiModels.TransferResponse;
import com.supersave.backend.emergency.EmergencyApiModels.VitalSigns;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class EmergencyDataService {

    private static final DateTimeFormatter TIMESTAMP_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final List<Hospital> baseHospitals = List.of(
            hospital("h1", "서울대학교병원", "서울시 종로구 대학로 101", 37.5799, 127.0017,
                    8, 3, 2, true, true, true, true, true,
                    List.of("심장내과", "신경외과", "정형외과", "소아과", "외상외과"),
                    45, 12, true, true, true, true, 2.3, 8, "medium"),
            hospital("h2", "삼성서울병원", "서울시 강남구 일원로 81", 37.4886, 127.0857,
                    12, 5, 4, true, true, true, true, true,
                    List.of("심장내과", "신경외과", "정형외과", "소아과", "응급의학과"),
                    30, 8, true, true, true, true, 5.7, 15, "low"),
            hospital("h3", "세브란스병원", "서울시 서대문구 연세로 50-1", 37.5625, 126.9403,
                    5, 2, 1, true, true, false, true, true,
                    List.of("심장내과", "신경외과", "소아과", "응급의학과"),
                    60, 18, true, true, true, true, 3.2, 12, "high"),
            hospital("h4", "서울아산병원", "서울시 송파구 올림픽로 43길 88", 37.5267, 127.1088,
                    15, 6, 5, true, true, true, true, true,
                    List.of("심장내과", "신경외과", "정형외과", "소아과", "외상외과", "응급의학과"),
                    25, 6, true, true, true, true, 6.8, 18, "low"),
            hospital("h5", "강남세브란스병원", "서울시 강남구 언주로 211", 37.5177, 127.0471,
                    6, 2, 2, true, false, true, false, true,
                    List.of("심장내과", "정형외과", "응급의학과"),
                    40, 10, true, false, true, true, 4.1, 13, "medium"),
            hospital("h6", "고려대학교 안암병원", "서울시 성북구 안암로 73", 37.5867, 127.0269,
                    10, 4, 3, true, true, true, true, true,
                    List.of("심장내과", "신경외과", "정형외과", "소아과", "응급의학과"),
                    35, 9, true, true, true, true, 3.5, 11, "low")
    );

    private final Patient patientTemplate = new Patient(
            "p1",
            "김환자",
            45,
            "male",
            "흉부 통증, 호흡곤란",
            "KTAS2",
            new VitalSigns("140/90", 95, 37.2, 94)
    );

    private final List<CongestionPoint> congestionData = List.of(
            new CongestionPoint("00:00", 5),
            new CongestionPoint("02:00", 3),
            new CongestionPoint("04:00", 2),
            new CongestionPoint("06:00", 4),
            new CongestionPoint("08:00", 8),
            new CongestionPoint("10:00", 12),
            new CongestionPoint("12:00", 15),
            new CongestionPoint("14:00", 14),
            new CongestionPoint("16:00", 16),
            new CongestionPoint("18:00", 18),
            new CongestionPoint("20:00", 14),
            new CongestionPoint("22:00", 10),
            new CongestionPoint("24:00", 7)
    );

    private final Map<String, ArrivingPatient> arrivals = new ConcurrentHashMap<>();
    private final AtomicInteger transferCounter = new AtomicInteger(100);
    private final AtomicInteger arrivalCounter = new AtomicInteger(1000);

    public EmergencyDataService() {
        seedArrivals();
    }

    public AppDataResponse getAppData() {
        return new AppDataResponse(getHospitals(), patientTemplate, congestionData);
    }

    public List<Hospital> getHospitals() {
        return baseHospitals.stream()
                .map(this::withDynamicArrivals)
                .toList();
    }

    public Hospital getHospital(String hospitalId) {
        return withDynamicArrivals(findBaseHospital(hospitalId));
    }

    public List<ArrivingPatient> getArrivals(String hospitalId) {
        findBaseHospital(hospitalId);
        return arrivals.values().stream()
                .filter(arrival -> arrival.hospitalId().equals(hospitalId))
                .sorted(Comparator
                        .comparingInt((ArrivingPatient arrival) -> switch (arrival.status()) {
                            case "pending" -> 0;
                            case "accepted" -> 1;
                            case "cancelled" -> 2;
                            default -> 3;
                        })
                        .thenComparingInt(ArrivingPatient::eta))
                .toList();
    }

    public List<HospitalRecommendation> recommend(RecommendationRequest request) {
        Patient patient = request.patient();
        return getHospitals().stream()
                .map(hospital -> {
                    double distanceScore = Math.max(0, 100 - hospital.distance() * 10);
                    double availabilityScore = (hospital.beds().general() + hospital.beds().icu() * 2 + hospital.beds().surgery() * 1.5) * 3;
                    double specializationScore = calculateSpecializationScore(hospital, patient);
                    double waitTimeScore = Math.max(0, 100 - hospital.currentWaitTime());
                    int totalScore = (int) Math.round(
                            distanceScore * 0.3 +
                                    availabilityScore * 0.3 +
                                    specializationScore * 0.2 +
                                    waitTimeScore * 0.2
                    );

                    return new HospitalRecommendation(
                            hospital,
                            totalScore,
                            new RecommendationBreakdown(distanceScore, availabilityScore, specializationScore, waitTimeScore),
                            buildAiAnalysis(hospital, patient)
                    );
                })
                .sorted(Comparator.comparingInt(HospitalRecommendation::score).reversed())
                .toList();
    }

    public TransferResponse createTransfer(TransferRequest request) {
        Hospital hospital = getHospital(request.hospitalId());
        String arrivalId = "ap-" + arrivalCounter.incrementAndGet();
        ArrivingPatient arrival = new ArrivingPatient(
                arrivalId,
                hospital.id(),
                request.patient().name(),
                request.patient().age(),
                request.patient().gender(),
                request.patient().severity(),
                request.patient().symptoms(),
                hospital.estimatedTime(),
                "현장 이송 요청",
                LocalDateTime.now().format(TIMESTAMP_FORMATTER),
                "pending"
        );
        arrivals.put(arrival.id(), arrival);

        return new TransferResponse(
                "tr-" + transferCounter.incrementAndGet(),
                hospital.id(),
                hospital.name(),
                hospital.estimatedTime(),
                "in_progress",
                hospital.name() + "에 도착 예정 알림이 전송되었습니다.",
                arrival
        );
    }

    public ArrivingPatient updateArrivalStatus(String arrivalId, ArrivalStatusUpdate update) {
        String status = normalizeStatus(update.status());
        ArrivingPatient current = arrivals.get(arrivalId);
        if (current == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "도착 예정 환자를 찾을 수 없습니다.");
        }

        ArrivingPatient updated = new ArrivingPatient(
                current.id(),
                current.hospitalId(),
                current.name(),
                current.age(),
                current.gender(),
                current.severity(),
                current.symptoms(),
                current.eta(),
                current.paramedic(),
                current.registeredAt(),
                status
        );
        arrivals.put(updated.id(), updated);
        return updated;
    }

    private Hospital findBaseHospital(String hospitalId) {
        return baseHospitals.stream()
                .filter(hospital -> hospital.id().equals(hospitalId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "병원을 찾을 수 없습니다."));
    }

    private Hospital withDynamicArrivals(Hospital baseHospital) {
        long activeArrivals = arrivals.values().stream()
                .filter(arrival -> arrival.hospitalId().equals(baseHospital.id()))
                .filter(arrival -> !"cancelled".equals(arrival.status()))
                .count();

        return new Hospital(
                baseHospital.id(),
                baseHospital.name(),
                baseHospital.address(),
                baseHospital.coordinates(),
                baseHospital.beds(),
                baseHospital.specialists(),
                baseHospital.departments(),
                baseHospital.currentWaitTime(),
                baseHospital.waitingPatients(),
                (int) activeArrivals,
                baseHospital.equipment(),
                baseHospital.distance(),
                baseHospital.estimatedTime(),
                baseHospital.congestionLevel()
        );
    }

    private double calculateSpecializationScore(Hospital hospital, Patient patient) {
        String symptoms = patient.symptoms();
        if (symptoms.contains("흉") || symptoms.contains("심장")) {
            return hospital.specialists().cardiology() ? 90 : 40;
        }
        if (symptoms.contains("뇌") || symptoms.contains("신경")) {
            return hospital.specialists().neurology() ? 90 : 40;
        }
        if (symptoms.contains("골절") || symptoms.contains("정형")) {
            return hospital.specialists().orthopedics() ? 90 : 40;
        }
        if (symptoms.contains("외상") || symptoms.contains("사고")) {
            return hospital.specialists().trauma() ? 95 : 35;
        }
        return 50;
    }

    private String buildAiAnalysis(Hospital hospital, Patient patient) {
        StringBuilder builder = new StringBuilder();
        builder.append("[AI 분석]\n\n");
        builder.append(hospital.name()).append("은(는) 현재 환자에게 적합한 병원입니다.\n\n");
        builder.append("주요 근거:\n");

        int reasonIndex = 1;
        if (hospital.beds().icu() >= 3) {
            builder.append(reasonIndex++).append(". 중환자실 병상이 충분합니다\n");
        }
        if (hospital.currentWaitTime() < 40) {
            builder.append(reasonIndex++).append(". 대기 시간이 비교적 짧습니다\n");
        }
        if (hospital.distance() < 5) {
            builder.append(reasonIndex++).append(". 환자 위치에서 가까운 거리에 있습니다\n");
        }
        if ((patient.symptoms().contains("흉") || patient.symptoms().contains("심장")) && hospital.specialists().cardiology()) {
            builder.append(reasonIndex++).append(". 심장내과 전문의가 상주하고 있습니다\n");
        }
        if (hospital.equipment().ct() && hospital.equipment().mri()) {
            builder.append(reasonIndex++).append(". 필수 의료 장비가 모두 구비되어 있습니다\n");
        }

        builder.append("\n환자의 증상 \"")
                .append(patient.symptoms())
                .append("\"을(를) 고려할 때, 신속한 이송을 권장합니다.");
        return builder.toString();
    }

    private String normalizeStatus(String status) {
        return switch (status) {
            case "pending", "accepted", "cancelled" -> status;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원하지 않는 상태값입니다.");
        };
    }

    private void seedArrivals() {
        addSeedArrival("ap-001", "h1", "김철수", 45, "male", "KTAS2", "급성 흉통, 호흡곤란", 8, "서울 119 구급대 3팀", "2026-04-06 14:23", "pending");
        addSeedArrival("ap-002", "h1", "박민수", 28, "male", "KTAS1", "교통사고, 다발성 외상", 5, "서울 119 구급대 1팀", "2026-04-06 14:35", "accepted");
        addSeedArrival("ap-003", "h1", "최지은", 35, "female", "KTAS2", "뇌졸중 의심 증상", 12, "서울 119 구급대 7팀", "2026-04-06 14:18", "pending");

        addSeedArrival("ap-004", "h2", "이영희", 62, "female", "KTAS3", "낙상 후 우측 고관절 통증", 15, "서울 119 구급대 5팀", "2026-04-06 14:30", "pending");
        addSeedArrival("ap-005", "h2", "오현우", 51, "male", "KTAS2", "급성 복통, 혈압 저하", 11, "서울 119 구급대 4팀", "2026-04-06 14:12", "accepted");

        addSeedArrival("ap-006", "h3", "한유진", 34, "female", "KTAS2", "의식 저하, 두통", 7, "서울 119 구급대 9팀", "2026-04-06 14:09", "pending");
        addSeedArrival("ap-007", "h3", "장민호", 49, "male", "KTAS3", "호흡곤란, 천식 악화", 10, "서울 119 구급대 6팀", "2026-04-06 14:11", "pending");
        addSeedArrival("ap-008", "h3", "윤서연", 18, "female", "KTAS4", "고열, 탈수", 18, "서울 119 구급대 2팀", "2026-04-06 13:58", "accepted");
        addSeedArrival("ap-009", "h3", "정우석", 57, "male", "KTAS2", "급성 흉부 압박감", 9, "서울 119 구급대 10팀", "2026-04-06 14:26", "pending");
        addSeedArrival("ap-010", "h3", "강소민", 40, "female", "KTAS3", "실신 후 의식 회복", 14, "서울 119 구급대 11팀", "2026-04-06 14:19", "pending");

        addSeedArrival("ap-011", "h4", "문도윤", 66, "male", "KTAS2", "심부전 악화", 6, "서울 119 구급대 8팀", "2026-04-06 14:31", "pending");

        addSeedArrival("ap-012", "h5", "송지아", 29, "female", "KTAS3", "손목 개방성 골절", 13, "서울 119 구급대 12팀", "2026-04-06 14:07", "pending");
        addSeedArrival("ap-013", "h5", "배준혁", 54, "male", "KTAS2", "교통사고 후 복부 통증", 10, "서울 119 구급대 13팀", "2026-04-06 14:28", "accepted");

        addSeedArrival("ap-014", "h6", "서하린", 43, "female", "KTAS2", "급성 편마비", 8, "서울 119 구급대 14팀", "2026-04-06 14:16", "pending");
        addSeedArrival("ap-015", "h6", "임태성", 38, "male", "KTAS3", "안면부 외상", 12, "서울 119 구급대 15팀", "2026-04-06 14:21", "accepted");
    }

    private void addSeedArrival(
            String id,
            String hospitalId,
            String name,
            int age,
            String gender,
            String severity,
            String symptoms,
            int eta,
            String paramedic,
            String registeredAt,
            String status
    ) {
        arrivals.put(id, new ArrivingPatient(
                id,
                hospitalId,
                name,
                age,
                gender,
                severity,
                symptoms,
                eta,
                paramedic,
                registeredAt,
                status
        ));
    }

    private static Hospital hospital(
            String id,
            String name,
            String address,
            double lat,
            double lng,
            int generalBeds,
            int icuBeds,
            int surgeryBeds,
            boolean cardiology,
            boolean neurology,
            boolean orthopedics,
            boolean pediatrics,
            boolean trauma,
            List<String> departments,
            int currentWaitTime,
            int waitingPatients,
            boolean ct,
            boolean mri,
            boolean xray,
            boolean ultrasound,
            double distance,
            int estimatedTime,
            String congestionLevel
    ) {
        return new Hospital(
                id,
                name,
                address,
                new Coordinates(lat, lng),
                new Beds(generalBeds, icuBeds, surgeryBeds),
                new Specialists(cardiology, neurology, orthopedics, pediatrics, trauma),
                departments,
                currentWaitTime,
                waitingPatients,
                0,
                new Equipment(ct, mri, xray, ultrasound),
                distance,
                estimatedTime,
                congestionLevel
        );
    }
}
