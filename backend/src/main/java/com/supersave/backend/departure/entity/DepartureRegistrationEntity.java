package com.supersave.backend.departure.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "departures")
public class DepartureRegistrationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long hospitalId;

    @Column(nullable = false)
    private double userLatitude;

    @Column(nullable = false)
    private double userLongitude;

    @Column(nullable = false)
    private int etaMinutes;

    @Column(nullable = false, length = 100)
    private String patientName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RequesterType requesterType;

    @Column(nullable = false, length = 20)
    private String severityLevel;

    @Column(length = 500)
    private String symptomSummary;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DepartureStatus status;

    protected DepartureRegistrationEntity() {
    }

    public DepartureRegistrationEntity(
            Long id,
            Long hospitalId,
            double userLatitude,
            double userLongitude,
            int etaMinutes,
            String patientName,
            RequesterType requesterType,
            String severityLevel,
            String symptomSummary,
            LocalDateTime createdAt,
            DepartureStatus status
    ) {
        this.id = id;
        this.hospitalId = hospitalId;
        this.userLatitude = userLatitude;
        this.userLongitude = userLongitude;
        this.etaMinutes = etaMinutes;
        this.patientName = patientName;
        this.requesterType = requesterType;
        this.severityLevel = severityLevel;
        this.symptomSummary = symptomSummary;
        this.createdAt = createdAt;
        this.status = status;
    }

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public static DepartureRegistrationEntity fromDomain(DepartureRegistration registration) {
        return new DepartureRegistrationEntity(
                registration.id(),
                registration.hospitalId(),
                registration.userLatitude(),
                registration.userLongitude(),
                registration.etaMinutes(),
                registration.patientName(),
                registration.requesterType(),
                registration.severityLevel(),
                registration.symptomSummary(),
                registration.createdAt(),
                registration.status()
        );
    }

    public DepartureRegistration toDomain() {
        return new DepartureRegistration(
                id,
                hospitalId,
                userLatitude,
                userLongitude,
                etaMinutes,
                patientName,
                requesterType,
                severityLevel,
                symptomSummary,
                createdAt,
                status
        );
    }

    public Long getId() {
        return id;
    }

    public Long getHospitalId() {
        return hospitalId;
    }

    public double getUserLatitude() {
        return userLatitude;
    }

    public double getUserLongitude() {
        return userLongitude;
    }

    public int getEtaMinutes() {
        return etaMinutes;
    }

    public String getPatientName() {
        return patientName;
    }

    public RequesterType getRequesterType() {
        return requesterType;
    }

    public String getSeverityLevel() {
        return severityLevel;
    }

    public String getSymptomSummary() {
        return symptomSummary;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public DepartureStatus getStatus() {
        return status;
    }

    public void setStatus(DepartureStatus status) {
        this.status = status;
    }
}
