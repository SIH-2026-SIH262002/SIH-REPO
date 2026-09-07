package com.ner.logistics.shipment;

import lombok.Builder;
import lombok.Data;

/**
 * Formal Supply Criticality Score Calculator.
 * Addresses Architecture Review Item #8: Defines exact mathematical criticality valuation function for supply-aware rerouting.
 */
public class SupplyCriticalityCalculator {

    @Data
    @Builder
    public static class CriticalityInput {
        private String commodityType;          // MEDICAL_OXYGEN, VACCINES, GRAIN, CEMENT, GENERAL
        private double totalShelfLifeHours;
        private double remainingShelfLifeHours;
        private double destinationInventoryDeficitRatio; // 0.0 to 1.0 (e.g. 0.8 = 80% deficit)
        private double populationServedFactor;          // 1.0 (town) to 10.0 (regional hospital)
    }

    @Data
    @Builder
    public static class CriticalityResult {
        private double criticalityScore; // 0.0 to 100.0
        private String priorityTier;      // CRITICAL, HIGH, MEDIUM, ROUTINE
        private double routingWeightPenaltyMultiplier;
    }

    public static CriticalityResult calculateCriticality(CriticalityInput input) {
        // Base Commodity Weight (w1)
        double commodityWeight = switch (input.getCommodityType() != null ? input.getCommodityType().toUpperCase() : "GENERAL") {
            case "MEDICAL_OXYGEN", "CRITICAL_MEDICINE" -> 40.0;
            case "VACCINES", "BLOOD_SUPPLIES" -> 35.0;
            case "EMERGENCY_RATIONS", "DRINKING_WATER" -> 30.0;
            case "GRAIN", "DISASTER_SHELTER_KITS" -> 20.0;
            default -> 10.0;
        };

        // Perishability Decay Factor (w2)
        double perishabilityRatio = 0.0;
        if (input.getTotalShelfLifeHours() > 0) {
            double ratio = 1.0 - (input.getRemainingShelfLifeHours() / input.getTotalShelfLifeHours());
            perishabilityRatio = Math.max(0.0, Math.min(1.0, ratio)) * 25.0;
        }

        // Destination Inventory Deficit (w3)
        double deficitScore = Math.max(0.0, Math.min(1.0, input.getDestinationInventoryDeficitRatio())) * 20.0;

        // Population Impact (w4)
        double popImpact = Math.max(1.0, Math.min(10.0, input.getPopulationServedFactor())) * 1.5;

        double totalScore = commodityWeight + perishabilityRatio + deficitScore + popImpact;
        totalScore = Math.max(0.0, Math.min(100.0, totalScore));

        String tier;
        double multiplier;
        if (totalScore >= 75.0) {
            tier = "CRITICAL";
            multiplier = 0.5; // High priority -> lower Dijkstra cost penalty for detour
        } else if (totalScore >= 50.0) {
            tier = "HIGH";
            multiplier = 0.75;
        } else if (totalScore >= 25.0) {
            tier = "MEDIUM";
            multiplier = 1.0;
        } else {
            tier = "ROUTINE";
            multiplier = 1.25;
        }

        return CriticalityResult.builder()
                .criticalityScore(Math.round(totalScore * 10.0) / 10.0)
                .priorityTier(tier)
                .routingWeightPenaltyMultiplier(multiplier)
                .build();
    }
}
