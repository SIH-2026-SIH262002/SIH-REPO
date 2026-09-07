package com.ner.logistics.risk;

import lombok.Builder;
import lombok.Data;

/**
 * Corridor Disruption Risk Index Model.
 * Addresses Architecture Review Item #2: Reframes ML model target from "Absolute Landslide Point Prediction"
 * to "Corridor Disruption Probability & Operational Risk Index" to avoid label survivorship bias and satellite latency.
 */
@Data
@Builder
public class CorridorDisruptionModel {

    private String corridorId;
    private double imdRainfallMm24h;       // IMD gridded rainfall (real-time API)
    private double demSlopeGradientDeg;     // DEM elevation model road slope
    private double historicalBlockageIndex; // Corridor blockage frequency metric
    private double vehicleTelemetryAnomaly; // Speed delta (actual vs speed limit)
    private double corridorDisruptionScore; // 0-100 continuous score
    private String riskCategory;            // LOW, MODERATE, HIGH, SEVERE

    public static CorridorDisruptionModel evaluateCorridor(
            String corridorId,
            double rainfall,
            double slope,
            double blockageIndex,
            double telemetryAnomaly) {

        // Corridor Disruption Formula (Fused operational signals)
        double score = (rainfall * 0.40) + (slope * 0.70) + (blockageIndex * 15.0) + (telemetryAnomaly * 2.5);
        score = Math.max(0.0, Math.min(100.0, score));

        String category;
        if (score >= 70) category = "SEVERE";
        else if (score >= 50) category = "HIGH";
        else if (score >= 25) category = "MODERATE";
        else category = "LOW";

        return CorridorDisruptionModel.builder()
                .corridorId(corridorId)
                .imdRainfallMm24h(rainfall)
                .demSlopeGradientDeg(slope)
                .historicalBlockageIndex(blockageIndex)
                .vehicleTelemetryAnomaly(telemetryAnomaly)
                .corridorDisruptionScore(Math.round(score * 10.0) / 10.0)
                .riskCategory(category)
                .build();
    }
}
