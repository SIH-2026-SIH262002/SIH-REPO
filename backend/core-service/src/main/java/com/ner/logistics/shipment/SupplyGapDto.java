package com.ner.logistics.shipment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplyGapDto {

    private String district;
    private String commodityType; // OXYGEN_CYLINDERS, ESSENTIAL_MEDICINE, DIESEL_FUEL, RICE_STAPLE
    private String riskLevel; // CRITICAL, HIGH, MEDIUM, LOW
    private Integer estimatedDelayHours;
    private Integer affectedShipmentsCount;
    private String recommendedAction;
    private String rationale;

    // Phase 3 Operational Consequence Additions
    private Double availableQuantity;
    private String unitOfMeasure;
    private Double consumptionRatePerHour;
    private String incomingShipmentCode;
    private String incomingShipmentEta;
    private Double incomingDelayHours;
    private Double projectedShortageHours;
    private Double recommendationConfidence;
    private List<String> reasons;
    private String dataFreshness;
}
