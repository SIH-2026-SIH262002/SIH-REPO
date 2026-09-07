package com.ner.logistics.recovery.engine;

import org.springframework.stereotype.Component;

/**
 * Infrastructure Priority Modifier.
 * Adjusts clearance hours based on BRO road classification priority and depot proximity.
 */
@Component
public class InfrastructurePriorityModifier {

    public double calculateInfrastructureModifierHours(String roadClassification, Double depotDistanceKm) {
        double modifier = 0.0;

        String roadClass = roadClassification != null ? roadClassification.toUpperCase() : "STATE_HIGHWAY";
        switch (roadClass) {
            case "NATIONAL_HIGHWAY" -> modifier -= 5.0; // -4h to -6h BRO priority response
            case "STATE_HIGHWAY" -> modifier += 0.0;
            case "DISTRICT_ROAD" -> modifier += 8.0;
            case "VILLAGE_ROAD" -> modifier += 14.0;    // +8h to +16h lower priority response
            default -> modifier += 2.0;
        }

        if (depotDistanceKm != null && depotDistanceKm > 50.0) {
            modifier += 4.0; // Remote corridor penalty
        }

        return modifier;
    }
}
