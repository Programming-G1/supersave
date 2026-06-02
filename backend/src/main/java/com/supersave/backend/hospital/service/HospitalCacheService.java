package com.supersave.backend.hospital.service;

import com.supersave.backend.hospital.entity.Hospital;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class HospitalCacheService {

    private static final String HOSPITAL_CACHE_PREFIX = "hospital:";
    private static final String ALL_HOSPITALS_CACHE_KEY = "hospitals:all";
    private static final long CACHE_TTL_MINUTES = 120; // 2시간

    private final RedisTemplate<String, Object> redisTemplate;

    public HospitalCacheService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * 모든 병원 정보를 Redis에 캐싱
     */
    public void cacheAllHospitals(Map<Long, Hospital> hospitals) {
        try {
            // 기존 데이터 삭제
            redisTemplate.delete(ALL_HOSPITALS_CACHE_KEY);
            
            // 새로운 데이터 저장
            hospitals.forEach((id, hospital) -> {
                String key = HOSPITAL_CACHE_PREFIX + id;
                redisTemplate.opsForValue().set(key, hospital, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
            });
            
            // 모든 병원 ID를 Set으로 관리
            hospitals.keySet().forEach(id -> {
                redisTemplate.opsForSet().add(ALL_HOSPITALS_CACHE_KEY, id);
            });
            redisTemplate.expire(ALL_HOSPITALS_CACHE_KEY, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        } catch (Exception e) {
            // 캐싱 실패는 서비스 중단이 아니므로 로그만 기록
            e.printStackTrace();
        }
    }

    /**
     * 특정 병원 정보 조회 (캐시에서)
     */
    public Hospital getHospitalFromCache(Long id) {
        try {
            String key = HOSPITAL_CACHE_PREFIX + id;
            Object cached = redisTemplate.opsForValue().get(key);
            if (cached instanceof Hospital hospital) {
                return hospital;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * 특정 병원 정보 캐싱
     */
    public void cacheHospital(Long id, Hospital hospital) {
        try {
            String key = HOSPITAL_CACHE_PREFIX + id;
            redisTemplate.opsForValue().set(key, hospital, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
            redisTemplate.opsForSet().add(ALL_HOSPITALS_CACHE_KEY, id);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * 캐시 초기화
     */
    public void clearCache() {
        try {
            Object[] hospitalIds = redisTemplate.opsForSet().members(ALL_HOSPITALS_CACHE_KEY).toArray();
            for (Object id : hospitalIds) {
                redisTemplate.delete(HOSPITAL_CACHE_PREFIX + id);
            }
            redisTemplate.delete(ALL_HOSPITALS_CACHE_KEY);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * 캐시 상태 확인
     */
    public boolean isCacheAvailable() {
        try {
            redisTemplate.getConnectionFactory().getConnection().ping();
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
