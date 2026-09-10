package com.ner.logistics.shipment;

import com.ner.logistics.incident.Incident;
import com.ner.logistics.incident.IncidentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SupplyGapAnalysisService {

    private final IncidentRepository incidentRepository;

    public List<SupplyGapDto> analyzeSupplyGaps() {
        List<Incident> activeIncidents = incidentRepository.findByStatus("ACTIVE");
        List<SupplyGapDto> gaps = new ArrayList<>();

        if (!activeIncidents.isEmpty()) {
            Incident inc = activeIncidents.get(0);
            String district = "Dima Hasao (Haflong)";

            // Gap 1: Medical Oxygen Supply
            gaps.add(SupplyGapDto.builder()
                    .district(district)
                    .commodityType("OXYGEN_CYLINDERS")
                    .riskLevel("CRITICAL")
                    .estimatedDelayHours(4)
                    .affectedShipmentsCount(1)
                    .recommendedAction("REROUTE_CONVOY_SH51_BYPASS")
                    .rationale("Medical convoy NER-07 carrying medical oxygen delayed at Haflong Pass due to active " + inc.getType())
                    .availableQuantity(14.0)
                    .unitOfMeasure("Cylinders")
                    .consumptionRatePerHour(2.2)
                    .incomingShipmentCode("NER-07")
                    .incomingShipmentEta("4h 20m")
                    .incomingDelayHours(4.0)
                    .projectedShortageHours(6.33)
                    .recommendationConfidence(0.88)
                    .reasons(List.of(
                            "Civil Hospital reserve down to 14.0 units",
                            "Consumption rate is 2.2 units/hour",
                            "Primary highway NH-27 clearance estimated > 18 hours",
                            "SH-51 Bypass adds only +18 km"
                    ))
                    .dataFreshness("Just now")
                    .build());

            // Gap 2: Essential Medicines & Vaccines
            gaps.add(SupplyGapDto.builder()
                    .district("Silchar (Cachar)")
                    .commodityType("ESSENTIAL_MEDICINE")
                    .riskLevel("HIGH")
                    .estimatedDelayHours(3)
                    .affectedShipmentsCount(1)
                    .recommendedAction("PRIORITIZE_CONVOY_NER12")
                    .rationale("District Hospital vaccine cold-chain budget expires if delay exceeds 3.5 hours")
                    .availableQuantity(450.0)
                    .unitOfMeasure("Vials")
                    .consumptionRatePerHour(45.0)
                    .incomingShipmentCode("NER-12")
                    .incomingShipmentEta("6h 45m")
                    .incomingDelayHours(3.5)
                    .projectedShortageHours(4.10)
                    .recommendationConfidence(0.82)
                    .reasons(List.of(
                            "Cold-chain thermal budget safe limit is 12.0 hours",
                            "Vairengte hill slope subsidence restricting single lane",
                            "SH-09 Mamit bypass avoids landslide hazard"
                    ))
                    .dataFreshness("2 mins ago")
                    .build());

            // Gap 3: Emergency Ration Supplies
            gaps.add(SupplyGapDto.builder()
                    .district("Kohima")
                    .commodityType("RICE_STAPLE")
                    .riskLevel("MEDIUM")
                    .estimatedDelayHours(2)
                    .affectedShipmentsCount(1)
                    .recommendedAction("DISPATCH_PEREN_BYPASS")
                    .rationale("Phedema Gap low network zone delaying grain convoy NER-21")
                    .availableQuantity(1200.0)
                    .unitOfMeasure("kg")
                    .consumptionRatePerHour(80.0)
                    .incomingShipmentCode("NER-21")
                    .incomingShipmentEta("5h 30m")
                    .incomingDelayHours(2.0)
                    .projectedShortageHours(3.50)
                    .recommendationConfidence(0.75)
                    .reasons(List.of(
                            "Relief camp demand elevated due to localized flash flooding",
                            "NER-21 telemetry degraded in low network zone"
                    ))
                    .dataFreshness("5 mins ago")
                    .build());
        } else {
            gaps.add(SupplyGapDto.builder()
                    .district("All NER Districts")
                    .commodityType("ALL_COMMODITIES")
                    .riskLevel("LOW")
                    .estimatedDelayHours(0)
                    .affectedShipmentsCount(0)
                    .recommendedAction("MAINTAIN_STANDARD_SCHEDULE")
                    .rationale("No active supply chain bottlenecks or commodity shipment disruptions detected.")
                    .availableQuantity(5000.0)
                    .unitOfMeasure("Units")
                    .consumptionRatePerHour(100.0)
                    .incomingShipmentCode("NONE")
                    .incomingShipmentEta("0h")
                    .incomingDelayHours(0.0)
                    .projectedShortageHours(0.0)
                    .recommendationConfidence(0.99)
                    .reasons(List.of("All regional freight corridors clear and operational"))
                    .dataFreshness("Just now")
                    .build());
        }

        return gaps;
    }
}
