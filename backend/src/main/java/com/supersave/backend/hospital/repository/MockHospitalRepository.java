package com.supersave.backend.hospital.repository;

import com.supersave.backend.common.exception.NotFoundException;
import com.supersave.backend.hospital.entity.Hospital;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class MockHospitalRepository implements HospitalRepository {

    private final Map<Long, Hospital> hospitals = new ConcurrentHashMap<>();

    public MockHospitalRepository() {
        List.of(
                new Hospital(1L, "서울대학교병원 권역응급의료센터", "서울 종로구 대학로 101", "02-2072-2114", 37.5796, 126.9989, 8, List.of("KTAS1", "KTAS2", "KTAS3", "KTAS4"), List.of("응급의학과", "심장내과", "신경외과", "외상외과"), List.of("응급의학과", "심장내과", "신경외과", "정형외과"), List.of("CT 가능", "MRI 가능", "인공호흡기 가능"), 18, 3, 7.5, 30, "서울 종로구"),
                new Hospital(2L, "삼성서울병원 응급진료센터", "서울 강남구 일원로 81", "02-3410-2114", 37.4882, 127.0850, 12, List.of("KTAS1", "KTAS2", "KTAS3"), List.of("응급의학과", "심장내과", "중환자의학", "외상외과"), List.of("응급의학과", "중환자의학", "호흡기내과"), List.of("CT 가능", "MRI 가능", "ECMO 가능"), 12, 2, 8.0, 22, "서울 강남구"),
                new Hospital(3L, "세브란스병원 응급진료센터", "서울 서대문구 연세로 50-1", "1599-1004", 37.5622, 126.9410, 5, List.of("KTAS1", "KTAS2", "KTAS3", "KTAS4"), List.of("응급의학과", "소아청소년과", "신경외과"), List.of("응급의학과", "소아청소년과", "신경외과"), List.of("CT 가능", "MRI 가능", "소아응급 가능"), 20, 4, 6.0, 40, "서울 서대문구"),
                new Hospital(4L, "서울아산병원 응급실", "서울 송파구 올림픽로43길 88", "1688-7575", 37.5262, 127.1087, 15, List.of("KTAS1", "KTAS2", "KTAS3"), List.of("응급의학과", "외상외과", "심장내과", "신경외과"), List.of("응급의학과", "중환자의학", "외상외과", "흉부외과"), List.of("CT 가능", "MRI 가능", "수술실 가능"), 10, 1, 9.5, 18, "서울 송파구")
        ).forEach(hospital -> hospitals.put(hospital.id(), hospital));
    }

    @Override
    public List<Hospital> findAll() {
        return hospitals.values().stream().sorted((a, b) -> a.id().compareTo(b.id())).toList();
    }

    @Override
    public Optional<Hospital> findById(Long id) {
        return Optional.ofNullable(hospitals.get(id));
    }

    @Override
    public Hospital save(Hospital hospital) {
        hospitals.put(hospital.id(), hospital);
        return hospital;
    }

    @Override
    public Hospital registerIncomingPatient(Long id) {
        Hospital current = hospitals.get(id);
        if (current == null) {
            throw new NotFoundException("Hospital " + id + " was not found");
        }
        Hospital updated = current.incrementIncomingPatients();
        hospitals.put(id, updated);
        return updated;
    }
}
