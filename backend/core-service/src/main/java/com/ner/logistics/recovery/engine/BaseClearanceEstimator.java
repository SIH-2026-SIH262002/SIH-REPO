package com.ner.logistics.recovery.engine;

import com.ner.logistics.recovery.CorridorRecoveryHistory;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Base Clearance Estimator Component.
 * Lookup base hours from historical median or fallback road classification baseline matrix.
 */
@Component
public class BaseClearanceEstimator {

    public double estimateBaseClearanceHours(String blockageType, String roadClassification, List<CorridorRecoveryHistory> historyList) {
        if (historyList != null && !historyList.isEmpty()) {
            List<Double> matchingHours = historyList.stream()
                    .filter(h -> blockageType == null || blockageType.equalsIgnoreCase(h.getBlockageType()))
                    .map(CorridorRecoveryHistory::getActualClearanceHours)
                    .filter(h -> h != null && h > 0)
                    .sorted()
                    .toList();

            if (!matchingHours.isEmpty()) {
                int middle = matchingHours.size() / 2;
                if (matchingHours.size() % 2 == 1) {
                    return matchingHours.get(middle);
                } else {
                    return (matchingHours.get(middle - 1) + matchingHours.get(middle)) / 2.0;
                }
            }
        }

        // Default baseline matrix if no historical data exists for corridor
        double baseType = switch (blockageType != null ? blockageType.toUpperCase() : "LANDSLIDE") {
            case "LANDSLIDE", "MUD_SLIDE" -> 16.0;
            case "ROCKFALL" -> 12.0;
            case "BRIDGE_RISK", "BRIDGE_COLLAPSE" -> 36.0;
            case "FLOODING" -> 20.0;
            default -> 14.0;
        };

        double classFactor = switch (roadClassification != null ? roadClassification.toUpperCase() : "STATE_HIGHWAY") {
            case "NATIONAL_HIGHWAY" -> 0.85;
            case "STATE_HIGHWAY" -> 1.0;
            case "DISTRICT_ROAD" -> 1.3;
            case "VILLAGE_ROAD" -> 1.6;
            default -> 1.0;
        };

        return baseType * classFactor;
    }
}
