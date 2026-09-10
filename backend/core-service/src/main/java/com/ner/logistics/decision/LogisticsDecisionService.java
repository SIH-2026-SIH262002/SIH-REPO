package com.ner.logistics.decision;

import com.ner.logistics.incident.Incident;
import com.ner.logistics.incident.IncidentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class LogisticsDecisionService {

    private final IncidentRepository incidentRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public List<DecisionRecommendationDto> getRecommendations() {
        List<Incident> activeIncidents = incidentRepository.findByStatus("ACTIVE");
        List<DecisionRecommendationDto> recommendations = new ArrayList<>();

        if (!activeIncidents.isEmpty()) {
            Incident majorIncident = activeIncidents.get(0);
            String incidentLoc = majorIncident.getLocationName() != null ? majorIncident.getLocationName()
                    : "Haflong Sector";

            // Rule 1: Medical / Oxygen Supply + Landslide Disruption -> REROUTE_VEHICLE
            recommendations.add(DecisionRecommendationDto.builder()
                    .decisionType("REROUTE_VEHICLE")
                    .priority("CRITICAL")
                    .targetEntity("Medical Convoy NER-07")
                    .affectedVehicle("NER-07")
                    .affectedShipment("SHP-MED-104 (Essential Medicines & Oxygen)")
                    .recommendedAction("Reroute NER-07 immediately via Haflong Bypass Corridor (132 km - Low Risk)")
                    .destinationDistrict("Silchar Civil Hospital")
                    .rationale("Primary NH-27 Corridor blocked by active " + majorIncident.getType() + " at "
                            + incidentLoc)
                    .createdAt(LocalDateTime.now())
                    .build());

            // Rule 2: Hazardous / Fuel Cargo + Severe Disruption -> HOLD_SHIPMENT
            recommendations.add(DecisionRecommendationDto.builder()
                    .decisionType("HOLD_SHIPMENT")
                    .priority("HIGH")
                    .targetEntity("Fuel Tanker NER-04")
                    .affectedVehicle("NER-04")
                    .affectedShipment("SHP-FUEL-209 (Diesel & Gasoline)")
                    .recommendedAction("Hold NER-04 at nearest safe checkpoint (Umrangso Staging Area)")
                    .destinationDistrict("Haflong Power Substation")
                    .rationale("Hazardous fuel cargo should not enter active disruption zone until clearance confirmed")
                    .createdAt(LocalDateTime.now())
                    .build());

            // Rule 3: Field Verification -> DISPATCH_FIELD_OFFICER
            recommendations.add(DecisionRecommendationDto.builder()
                    .decisionType("DISPATCH_FIELD_OFFICER")
                    .priority("HIGH")
                    .targetEntity("Haflong Sector Field Unit")
                    .affectedVehicle("FIELD-UNIT-01")
                    .affectedShipment("N/A")
                    .recommendedAction("Dispatch Field Officer to " + incidentLoc + " for geotagged verification")
                    .destinationDistrict("Dima Hasao")
                    .rationale("Assess road clearance progress and confirm secondary rockfall stability")
                    .createdAt(LocalDateTime.now())
                    .build());

            // Rule 4: Oxygen shortage escalation -> ESCALATE_EMERGENCY
            if ("CRITICAL".equalsIgnoreCase(
                    majorIncident.getSeverityScore() != null && majorIncident.getSeverityScore() > 7.0 ? "CRITICAL"
                            : "HIGH")) {
                recommendations.add(DecisionRecommendationDto.builder()
                        .decisionType("ESCALATE_EMERGENCY")
                        .priority("CRITICAL")
                        .targetEntity("State Disaster Response Command")
                        .affectedVehicle("ALL_CONVOYS_DIMA_HASAO")
                        .affectedShipment("CRITICAL_MEDICAL_SUPPLIES")
                        .recommendedAction(
                                "Escalate emergency protocol and request NDRF priority green corridor clearing")
                        .destinationDistrict("Dima Hasao / Cachar Sector")
                        .rationale("Multiple essential convoys delayed beyond 3 hours in hill terrain corridor")
                        .createdAt(LocalDateTime.now())
                        .build());
            }
        } else {
            recommendations.add(DecisionRecommendationDto.builder()
                    .decisionType("MONITOR")
                    .priority("NORMAL")
                    .targetEntity("All Active Logistics Convoys")
                    .affectedVehicle("NER-01 to NER-08")
                    .affectedShipment("ALL_ACTIVE_SHIPMENTS")
                    .recommendedAction("Maintain standard transit speeds on primary hill corridors")
                    .destinationDistrict("NER Regional Network")
                    .rationale("No active disruptions or hazard alerts reported on primary logistics corridors")
                    .createdAt(LocalDateTime.now())
                    .build());
        }

        // Broadcast decision updates via WebSockets
        messagingTemplate.convertAndSend("/topic/decisions", recommendations);

        return recommendations;
    }
}
