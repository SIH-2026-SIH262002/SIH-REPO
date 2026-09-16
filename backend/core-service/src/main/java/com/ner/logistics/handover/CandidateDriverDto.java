package com.ner.logistics.handover;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateDriverDto {

    private Long driverId;

    private String username;

    private String fullName;

    private String phoneNumber;

    private String licenseNumber;

    private String licenseCategory;

    private String baseDepot;

    private Double currentLatitude;

    private Double currentLongitude;

    private Double distanceKm; // Real road distance via GraphHopper

    private Integer etaMinutes; // Real travel duration via GraphHopper

    private String riskLevel; // LOW, MODERATE, HIGH, CRITICAL

    private Double compositeScore; // Composite ranking score (lower is faster/safer)

    private boolean isFallbackEstimate; // True if routing engine was unreachable
}
