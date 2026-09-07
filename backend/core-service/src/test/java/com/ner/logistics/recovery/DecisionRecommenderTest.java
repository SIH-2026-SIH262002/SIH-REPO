package com.ner.logistics.recovery;

import com.ner.logistics.recovery.engine.DecisionRecommender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class DecisionRecommenderTest {

    private DecisionRecommender recommender;

    @BeforeEach
    void setUp() {
        recommender = new DecisionRecommender();
    }

    @Test
    void testWaitRecommendationWhenClearanceFasterThanDetour() {
        DecisionRecommender.DecisionInput input = DecisionRecommender.DecisionInput.builder()
                .predictedClearanceHours(6.0)
                .alternateRouteTimeHours(12.0)
                .directDistanceKm(90.0)
                .shipmentCriticality("HIGH")
                .build();

        DecisionRecommender.DecisionOutput output = recommender.recommendAction(input);
        assertEquals("WAIT", output.getRecommendedAction());
        assertTrue(output.getReasoningSummary().contains("RECOMMEND WAIT"));
    }

    @Test
    void testRerouteRecommendationForCriticalCargo() {
        DecisionRecommender.DecisionInput input = DecisionRecommender.DecisionInput.builder()
                .predictedClearanceHours(18.0)
                .alternateRouteTimeHours(10.0)
                .directDistanceKm(90.0)
                .shipmentCriticality("CRITICAL")
                .build();

        DecisionRecommender.DecisionOutput output = recommender.recommendAction(input);
        assertEquals("REROUTE", output.getRecommendedAction());
        assertTrue(output.getReasoningSummary().contains("RECOMMEND REROUTE"));
    }

    @Test
    void testHoldRecommendationForRoutineCargo() {
        DecisionRecommender.DecisionInput input = DecisionRecommender.DecisionInput.builder()
                .predictedClearanceHours(18.0)
                .alternateRouteTimeHours(10.0)
                .directDistanceKm(90.0)
                .shipmentCriticality("ROUTINE")
                .build();

        DecisionRecommender.DecisionOutput output = recommender.recommendAction(input);
        assertEquals("HOLD", output.getRecommendedAction());
        assertTrue(output.getReasoningSummary().contains("RECOMMEND HOLD"));
    }

    @Test
    void testColdChainEmergencyRerouteRule() {
        DecisionRecommender.DecisionInput input = DecisionRecommender.DecisionInput.builder()
                .predictedClearanceHours(18.0)
                .alternateRouteTimeHours(10.0)
                .directDistanceKm(90.0)
                .shipmentCriticality("CRITICAL")
                .coldChainThermalBudgetHours(12.0) // 12h thermal budget < 18h clearance
                .build();

        DecisionRecommender.DecisionOutput output = recommender.recommendAction(input);
        assertEquals("EMERGENCY_REROUTE", output.getRecommendedAction());
        assertTrue(output.getReasoningSummary().contains("EMERGENCY REROUTE"));
    }
}
