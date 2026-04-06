package com.supersave.backend.emergency;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public final class EmergencyApiModels {

    private EmergencyApiModels() {
    }

    public record Coordinates(double lat, double lng) {
    }

    public record Beds(int general, int icu, int surgery) {
    }

    public record Specialists(
            boolean cardiology,
            boolean neurology,
            boolean orthopedics,
            boolean pediatrics,
            boolean trauma
    ) {
    }

    public record Equipment(
            boolean ct,
            boolean mri,
            boolean xray,
            boolean ultrasound
    ) {
    }

    public record Hospital(
            String id,
            String name,
            String address,
            Coordinates coordinates,
            Beds beds,
            Specialists specialists,
            List<String> departments,
            int currentWaitTime,
            int waitingPatients,
            int arrivingPatients,
            Equipment equipment,
            double distance,
            int estimatedTime,
            String congestionLevel
    ) {
    }

    public record VitalSigns(
            String bloodPressure,
            int heartRate,
            double temperature,
            int oxygenSaturation
    ) {
    }

    public record Patient(
            String id,
            @NotBlank String name,
            @Min(0) int age,
            @NotBlank String gender,
            @NotBlank String symptoms,
            @NotBlank String severity,
            @Valid @NotNull VitalSigns vitalSigns
    ) {
    }

    public record CongestionPoint(String time, int patients) {
    }

    public record ArrivingPatient(
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
    }

    public record AppDataResponse(
            List<Hospital> hospitals,
            Patient patientTemplate,
            List<CongestionPoint> congestionData
    ) {
    }

    public record RecommendationBreakdown(
            double distance,
            double availability,
            double specialization,
            double waitTime
    ) {
    }

    public record HospitalRecommendation(
            Hospital hospital,
            int score,
            RecommendationBreakdown reasons,
            String aiAnalysis
    ) {
    }

    public record RecommendationRequest(@Valid @NotNull Patient patient) {
    }

    public record TransferRequest(
            @NotBlank String hospitalId,
            @Valid @NotNull Patient patient
    ) {
    }

    public record TransferResponse(
            String transferId,
            String hospitalId,
            String hospitalName,
            int estimatedTime,
            String status,
            String message,
            ArrivingPatient arrival
    ) {
    }

    public record ArrivalStatusUpdate(@NotBlank String status) {
    }

    public record HealthResponse(String status, String timestamp) {
    }
}
