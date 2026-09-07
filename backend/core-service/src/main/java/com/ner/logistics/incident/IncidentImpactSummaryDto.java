package com.ner.logistics.incident;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentImpactSummaryDto {

    private Long incidentId;
    private String incidentType;
    private String districtName;
    private String reportedSeverity;
    private String recommendedSeverity;
    private Integer severityScore;
    private Double confidenceLevel;
    private Integer affectedVehiclesCount;
    private List<String> affectedVehicleCodes;
    private Integer affectedShipmentsCount;
    private List<String> affectedCommodities;
    private String verificationStatus;

    // Phase 4 Relationship Chain Additions
    private List<CorridorImpactItem> affectedCorridors;
    private List<VehicleImpactItem> affectedVehiclesDetails;
    private List<ShipmentImpactItem> affectedShipmentsDetails;
    private String supplyImpactSummary;
    private String recommendedAction;
    private String recommendationReason;
    private Double recommendationConfidence;
    private List<String> reasoningBullets;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CorridorImpactItem {
        private String corridorCode;
        private String corridorName;
        private String accessibilityStatus;
        private String disruptionSeverity;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VehicleImpactItem {
        private String vehicleCode;
        private String driverName;
        private String status;
        private String currentPosition;
        private String destination;
        private String eta;
        private String riskLevel;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ShipmentImpactItem {
        private String shipmentCode;
        private String commodity;
        private String priority;
        private String destination;
        private String eta;
        private Double delayHours;
        private String supplyCriticality;
    }
}
