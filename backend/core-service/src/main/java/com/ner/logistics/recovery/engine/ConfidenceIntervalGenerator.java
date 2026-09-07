package com.ner.logistics.recovery.engine;

import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Component;

/**
 * Confidence Interval Generator.
 * Uncertainty quantification based on historical sample size for corridor.
 */
@Component
public class ConfidenceIntervalGenerator {

    @Data
    @Builder
    public static class ConfidenceBounds {
        private double confidenceLowHours;
        private double confidenceHighHours;
        private double marginOfErrorHours;
        private String confidenceRating; // HIGH_CONFIDENCE, MODERATE_CONFIDENCE, WIDE_INTERVAL_UNCERTAIN
    }

    public ConfidenceBounds generateBounds(double predictedClearanceHours, int historicalSampleCount) {
        double margin;
        String rating;

        if (historicalSampleCount > 5) {
            margin = 4.0;
            rating = "HIGH_CONFIDENCE";
        } else if (historicalSampleCount >= 1) {
            margin = 8.0;
            rating = "MODERATE_CONFIDENCE";
        } else {
            margin = 16.0;
            rating = "WIDE_INTERVAL_UNCERTAIN";
        }

        double low = Math.max(1.0, predictedClearanceHours - margin);
        double high = predictedClearanceHours + margin;

        return ConfidenceBounds.builder()
                .confidenceLowHours(Math.round(low * 10.0) / 10.0)
                .confidenceHighHours(Math.round(high * 10.0) / 10.0)
                .marginOfErrorHours(margin)
                .confidenceRating(rating)
                .build();
    }
}
