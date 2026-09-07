package com.ner.logistics.recovery;

import com.ner.logistics.decision.OperationalOutcome;
import com.ner.logistics.recovery.controller.CorridorRecoveryController;
import com.ner.logistics.recovery.dto.RecoveryOverrideDto;
import com.ner.logistics.recovery.dto.RerouteRecommendationDto;
import com.ner.logistics.recovery.service.CorridorRecoveryPredictionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class CorridorRecoveryControllerTest {

    @Mock
    private CorridorRecoveryPredictionService predictionService;

    private CorridorRecoveryController controller;

    @BeforeEach
    void setUp() {
        controller = new CorridorRecoveryController(predictionService);
    }

    @Test
    void testTriggerRecoveryPrediction() {
        CorridorRecoveryPrediction dummy = CorridorRecoveryPrediction.builder()
                .predictionId("PRED-1001")
                .corridorId("NH-27_HAFLONG_PASS")
                .predictedClearanceHours(18.0)
                .confidenceLowHours(14.0)
                .confidenceHighHours(22.0)
                .recommendedAction("REROUTE")
                .reasoningSummary("RECOMMEND REROUTE")
                .generatedAt(LocalDateTime.now())
                .build();

        when(predictionService.generatePrediction(eq("NH-27_HAFLONG_PASS"), any(), any(), any())).thenReturn(dummy);

        ResponseEntity<CorridorRecoveryPrediction> response = controller.triggerRecoveryPrediction("NH-27_HAFLONG_PASS", null, 65.0, 80);

        assertNotNull(response.getBody());
        assertEquals("PRED-1001", response.getBody().getPredictionId());
        assertEquals(18.0, response.getBody().getPredictedClearanceHours());
    }

    @Test
    void testGetRerouteRecommendation() {
        RerouteRecommendationDto dummy = RerouteRecommendationDto.builder()
                .incidentId(101L)
                .corridorId("NH-27_HAFLONG_PASS")
                .predictionId("PRED-1001")
                .predictedClearanceHours(18.0)
                .recommendedAction("EMERGENCY_REROUTE")
                .coldChainThermalBudgetHours(12.0)
                .build();

        when(predictionService.getRerouteRecommendation(101L, 12.0)).thenReturn(dummy);

        ResponseEntity<RerouteRecommendationDto> response = controller.getRerouteRecommendation(101L, 12.0);

        assertNotNull(response.getBody());
        assertEquals("EMERGENCY_REROUTE", response.getBody().getRecommendedAction());
        assertEquals(12.0, response.getBody().getColdChainThermalBudgetHours());
    }

    @Test
    void testOverridePredictionEndpoint() {
        RecoveryOverrideDto overrideDto = RecoveryOverrideDto.builder()
                .predictionId("PRED-1001")
                .overrideAction("OVERRIDE_WAIT")
                .operatorNotes("Haflong BRO clearance team already on-site with 2 extra excavators")
                .build();

        CorridorRecoveryPrediction updated = CorridorRecoveryPrediction.builder()
                .predictionId("PRED-1001")
                .isOverridden(true)
                .overrideAction("OVERRIDE_WAIT")
                .recommendedAction("OVERRIDE_WAIT")
                .build();

        when(predictionService.processOperatorOverride(any(RecoveryOverrideDto.class), eq("OPERATOR_01"))).thenReturn(updated);

        ResponseEntity<CorridorRecoveryPrediction> response = controller.overridePrediction("NH-27_HAFLONG_PASS", overrideDto, null);

        assertNotNull(response.getBody());
        assertEquals("OVERRIDE_WAIT", response.getBody().getRecommendedAction());
    }
}
