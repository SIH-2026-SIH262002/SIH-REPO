package com.ner.logistics.mobile;

import lombok.Builder;
import lombok.Data;

/**
 * Evaluates driver safety rules based on operational hazard context.
 * Addresses Architecture Review Item #6: Replaces binary speed lockout with contextual safety scoring.
 */
public class DriverSafetyContextEvaluator {

    @Data
    @Builder
    public static class SafetyContextResult {
        private boolean allowOneTapMovingAlert;
        private boolean requireStationaryForPhotos;
        private String safetyRecommendation;
        private String riskTier;
    }

    public static SafetyContextResult evaluateSafetyRule(double currentSpeedKmh, double corridorRiskScore, boolean inHazardZone) {
        if (inHazardZone || corridorRiskScore >= 60.0) {
            // Vehicle is in or near high-risk hazard zone (e.g. active landslide pass)
            // Allow immediate 1-tap/voice report even while moving to avoid forcing driver to stop in hazard area
            return SafetyContextResult.builder()
                    .allowOneTapMovingAlert(true)
                    .requireStationaryForPhotos(false)
                    .safetyRecommendation("HAZARD ZONE DETECTED: One-tap voice/coordinate alert enabled while moving. Do NOT stop on narrow mountain ledges!")
                    .riskTier("HIGH_HAZARD_ZONE")
                    .build();
        } else if (currentSpeedKmh > 15.0) {
            // Normal road section, vehicle moving faster than 15 km/h
            return SafetyContextResult.builder()
                    .allowOneTapMovingAlert(true)
                    .requireStationaryForPhotos(true)
                    .safetyRecommendation("SAFE CORRIDOR: Vehicle moving. Detailed photo uploads restricted until vehicle comes to a complete stop.")
                    .riskTier("NORMAL_MOVING")
                    .build();
        } else {
            // Vehicle stationary or moving very slowly in safe zone
            return SafetyContextResult.builder()
                    .allowOneTapMovingAlert(true)
                    .requireStationaryForPhotos(false)
                    .safetyRecommendation("VEHICLE STATIONARY: All reporting modes, photo capture, and detailed form entries enabled.")
                    .riskTier("STATIONARY_SAFE")
                    .build();
        }
    }
}
