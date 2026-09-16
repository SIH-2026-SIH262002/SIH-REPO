package com.ner.logistics.driver;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverProfileDto {

    private Long userId;

    private String username;

    @NotBlank(message = "License number is required")
    private String licenseNumber;

    @NotBlank(message = "License category is required")
    private String licenseCategory; // TRANS_HEAVY, HMV, HAZMAT, LIGHT_COMMERCIAL

    private LocalDate licenseExpiry;

    private String operationalStatus;

    private String fitnessStatus;

    private String baseDepot;

    private Double currentLatitude;

    private Double currentLongitude;

    private String assignedVehicleCode;

    private String emergencyContactName;

    private String emergencyContactPhone;
}
