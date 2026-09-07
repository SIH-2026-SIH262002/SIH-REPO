package com.ner.logistics.recovery.engine;

import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Component;

/**
 * Decision Recommender Component.
 * Addresses Senior Architecture Review Item #1: Dual-mode route time estimation (NetworkX API or heuristic fallback).
 * Fuses predicted clearance hours, alternate route travel time, supply criticality, and cold-chain thermal budget.
 */
@Component
public class DecisionRecommender {

    @Data
    @Builder
    public static class DecisionInput {
        private double predictedClearanceHours;
        private Double alternateRouteTimeHours;
        private double directDistanceKm;
        private String shipmentCriticality; // CRITICAL, HIGH, MEDIUM, ROUTINE
        private Double coldChainThermalBudgetHours; // Null if non-cold chain cargo
    }

    @Data
    @Builder
    public static class DecisionOutput {
        private String recommendedAction; // WAIT, REROUTE, HOLD, EMERGENCY_REROUTE
        private String reasoningSummary;
        private double effectiveAlternateRouteTimeHours;
        private String routeEstimationMode; // NETWORKX_DIJKSTRA, HEURISTIC_SPATIAL
    }

    public DecisionOutput recommendAction(DecisionInput input) {
        double altTime;
        String mode;

        if (input.getAlternateRouteTimeHours() != null && input.getAlternateRouteTimeHours() > 0) {
            altTime = input.getAlternateRouteTimeHours();
            mode = "NETWORKX_DIJKSTRA";
        } else {
            // Heuristic Fallback: 1.5 detour multiplier at 35 km/h mountain speed
            double distance = input.getDirectDistanceKm() > 0 ? input.getDirectDistanceKm() : 120.0;
            altTime = (distance * 1.5) / 35.0;
            mode = "HEURISTIC_SPATIAL";
        }
        altTime = Math.round(altTime * 10.0) / 10.0;

        double predicted = input.getPredictedClearanceHours();
        String criticality = input.getShipmentCriticality() != null ? input.getShipmentCriticality().toUpperCase() : "MEDIUM";
        Double thermalBudget = input.getColdChainThermalBudgetHours();

        // 1. Cold Chain Emergency Rule
        if (thermalBudget != null && thermalBudget > 0 && predicted > thermalBudget) {
            String reasoning = String.format("EMERGENCY REROUTE: Cold-chain thermal budget (%.1fh) expires BEFORE predicted clearance (%.1fh). Immediate detour required via alternate route (%.1fh).",
                    thermalBudget, predicted, altTime);
            return DecisionOutput.builder()
                    .recommendedAction("EMERGENCY_REROUTE")
                    .reasoningSummary(reasoning)
                    .effectiveAlternateRouteTimeHours(altTime)
                    .routeEstimationMode(mode)
                    .build();
        }

        // 2. Faster Clearance than Reroute Rule
        if (predicted < altTime) {
            String reasoning = String.format("RECOMMEND WAIT: Predicted corridor clearance (%.1fh) is faster than alternate detour route (%.1fh). Priority clearance underway.",
                    predicted, altTime);
            return DecisionOutput.builder()
                    .recommendedAction("WAIT")
                    .reasoningSummary(reasoning)
                    .effectiveAlternateRouteTimeHours(altTime)
                    .routeEstimationMode(mode)
                    .build();
        }

        // 3. High Criticality Reroute Rule
        if ("CRITICAL".equalsIgnoreCase(criticality) || "HIGH".equalsIgnoreCase(criticality)) {
            String reasoning = String.format("RECOMMEND REROUTE: %s cargo cannot tolerate predicted %s clearance (%.1fh > alternate %.1fh). Rerouting vehicle via alternate corridor.",
                    criticality, predicted > 24 ? "long-term" : "delayed", predicted, altTime);
            return DecisionOutput.builder()
                    .recommendedAction("REROUTE")
                    .reasoningSummary(reasoning)
                    .effectiveAlternateRouteTimeHours(altTime)
                    .routeEstimationMode(mode)
                    .build();
        }

        // 4. Routine Cargo Hold Rule
        String reasoning = String.format("RECOMMEND HOLD: %s cargo queued at staging area. Predicted clearance (%.1fh) exceeds alternate route (%.1fh), but shipment is routine priority.",
                criticality, predicted, altTime);
        return DecisionOutput.builder()
                .recommendedAction("HOLD")
                .reasoningSummary(reasoning)
                .effectiveAlternateRouteTimeHours(altTime)
                .routeEstimationMode(mode)
                .build();
    }
}
