package com.ner.logistics.risk;

import lombok.Builder;
import lombok.Data;

/**
 * Dempster-Shafer Evidence Combination & Exponential Time-Decay Confidence Engine.
 * Addresses Architecture Review Item #5: Provides true uncertainty quantification and time-decay modeling.
 */
public class DempsterShaferConfidenceEngine {

    // Half-life for sensor telemetry decay (4 hours = 14400 seconds)
    private static final double LAMBDA_DECAY = Math.log(2.0) / 14400.0;

    @Data
    @Builder
    public static class EvidenceSource {
        private String sourceId;
        private String sourceType; // IOT_SENSOR, HUMAN_DRIVER, FIELD_OFFICER, SATELLITE
        private double beliefHazard; // Mass assigned to hazard hypothesis [0, 1]
        private double beliefSafe;   // Mass assigned to safe hypothesis [0, 1]
        private double uncertainty;   // Mass assigned to uncommitted uncertainty [0, 1]
        private long timestampEpochSec;
    }

    @Data
    @Builder
    public static class CombinedBeliefResult {
        private double combinedBeliefHazard;
        private double combinedBeliefSafe;
        private double combinedUncertainty;
        private double overallConfidenceScore; // 0 to 100
        private double conflictMetric;         // K conflict metric between sources
    }

    /**
     * Calculates time-decayed confidence based on observation age.
     * C(t) = C0 * e^(-lambda * deltaT)
     */
    public static double calculateTimeDecayedConfidence(double initialConfidence, long lastUpdatedEpochSec, long currentEpochSec) {
        long deltaT = Math.max(0, currentEpochSec - lastUpdatedEpochSec);
        double decayFactor = Math.exp(-LAMBDA_DECAY * deltaT);
        return Math.max(0.0, Math.min(100.0, initialConfidence * decayFactor));
    }

    /**
     * Fuses two independent evidence sources using Dempster's Rule of Combination.
     */
    public static CombinedBeliefResult fuseDempsterShafer(EvidenceSource e1, EvidenceSource e2, long currentEpochSec) {
        // Apply time decay to uncertainties
        double decay1 = Math.exp(-LAMBDA_DECAY * Math.max(0, currentEpochSec - e1.getTimestampEpochSec()));
        double decay2 = Math.exp(-LAMBDA_DECAY * Math.max(0, currentEpochSec - e2.getTimestampEpochSec()));

        double m1_H = e1.getBeliefHazard() * decay1;
        double m1_S = e1.getBeliefSafe() * decay1;
        double m1_U = 1.0 - (m1_H + m1_S);

        double m2_H = e2.getBeliefHazard() * decay2;
        double m2_S = e2.getBeliefSafe() * decay2;
        double m2_U = 1.0 - (m2_H + m2_S);

        // Conflict calculation K = m1(H)*m2(S) + m1(S)*m2(H)
        double kConflict = (m1_H * m2_S) + (m1_S * m2_H);
        double normalizationFactor = 1.0 - kConflict;

        if (normalizationFactor <= 0.001) {
            // Extreme conflict fallback
            return CombinedBeliefResult.builder()
                    .combinedBeliefHazard(0.5)
                    .combinedBeliefSafe(0.5)
                    .combinedUncertainty(1.0)
                    .overallConfidenceScore(10.0)
                    .conflictMetric(1.0)
                    .build();
        }

        double fused_H = ((m1_H * m2_H) + (m1_H * m2_U) + (m1_U * m2_H)) / normalizationFactor;
        double fused_S = ((m1_S * m2_S) + (m1_S * m2_U) + (m1_U * m2_S)) / normalizationFactor;
        double fused_U = (m1_U * m2_U) / normalizationFactor;

        double confidenceScore = Math.max(0.0, Math.min(100.0, (1.0 - fused_U - kConflict * 0.5) * 100.0));

        return CombinedBeliefResult.builder()
                .combinedBeliefHazard(Math.round(fused_H * 1000.0) / 1000.0)
                .combinedBeliefSafe(Math.round(fused_S * 1000.0) / 1000.0)
                .combinedUncertainty(Math.round(fused_U * 1000.0) / 1000.0)
                .overallConfidenceScore(Math.round(confidenceScore * 10.0) / 10.0)
                .conflictMetric(Math.round(kConflict * 1000.0) / 1000.0)
                .build();
    }
}
