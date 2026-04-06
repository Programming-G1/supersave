package com.supersave.backend.alert.service;

import com.supersave.backend.alert.dto.AlertResponse;
import com.supersave.backend.hospital.entity.Hospital;
import com.supersave.backend.hospital.repository.HospitalRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AlertService {

    private final HospitalRepository hospitalRepository;

    public AlertService(HospitalRepository hospitalRepository) {
        this.hospitalRepository = hospitalRepository;
    }

    public List<AlertResponse> getAlerts() {
        List<AlertResponse> alerts = new ArrayList<>();
        for (Hospital hospital : hospitalRepository.findAll()) {
            if (hospital.availableBeds() <= 5) {
                alerts.add(new AlertResponse("beds-" + hospital.id(), "WARNING", "병상 부족 경보",
                        hospital.name() + "의 가용 병상이 낮습니다. 대체 병원 비교가 필요합니다.", hospital.region(), LocalDateTime.now()));
            }
            if (!hospital.severityLevels().contains("KTAS1")) {
                alerts.add(new AlertResponse("critical-" + hospital.id(), "INFO", "최중증 수용 제한",
                        hospital.name() + "은 현재 KTAS1 대응 범위가 제한적입니다.", hospital.region(), LocalDateTime.now()));
            }
        }
        if (alerts.isEmpty()) {
            alerts.add(new AlertResponse("normal-state", "NORMAL", "시스템 정상 상태",
                    "현재 등록된 mock 데이터 기준 중대한 병상 경보는 없습니다.", "서울", LocalDateTime.now()));
        }
        return alerts;
    }
}
