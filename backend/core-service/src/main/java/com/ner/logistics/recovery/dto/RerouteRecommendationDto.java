package com.ner.logistics.recovery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RerouteRecommendationDto {

    private Long incidentId;
    private String corridorId;
    private String predictionId;
    private Double predictedClearanceHours;
    private Double confidenceLowHours;
    private Double confidenceHighHours;
    private String recommendedAction;
    private String reasoningSummary;
    private String shipmentCriticalityTier;
    private Double criticalityScore;
    private Double coldChainThermalBudgetHours;
    private String routeEstimationMode;
}
