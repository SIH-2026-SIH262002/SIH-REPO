package com.ner.logistics.risk;

import com.ner.logistics.incident.Incident;
import com.ner.logistics.incident.IncidentRepository;
import com.ner.logistics.risk.dto.RiskEvaluationRequest;
import com.ner.logistics.risk.dto.RiskEvaluationResponse;
import com.ner.logistics.risk.service.RiskEngineService;
import com.ner.logistics.risk.service.RiskLevelResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class RiskEngineServiceTest {

    @Mock
    private IncidentRepository incidentRepository;

    private RiskLevelResolver riskLevelResolver;

    private RiskEngineService riskEngineService;

    @BeforeEach
    void setUp() {
        riskLevelResolver = new RiskLevelResolver();
        riskEngineService = new RiskEngineService(incidentRepository, riskLevelResolver);
    }

    @Test
    void testLowRiskScenario() {
        when(incidentRepository.findIncidentsNearLocation(anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(Collections.emptyList());

        RiskEvaluationRequest req = RiskEvaluationRequest.builder()
                .latitude(20.0)
                .longitude(80.0)
                .rainfallMm24h(10.0)
                .roadCondition("GOOD")
                .build();

        RiskEvaluationResponse resp = riskEngineService.evaluateRealTimeRisk(req);

        assertEquals("LOW", resp.getCurrentRiskLevel());
        assertEquals("DEMPSTER_SHAFER_FUSED", resp.getAssessmentType());
        assertNotNull(resp.getConfidenceScore());
        assertTrue(resp.getCurrentRiskScore() < 31);
    }

    @Test
    void testHighRiskScenario() {
        when(incidentRepository.findIncidentsNearLocation(anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(Collections.emptyList());

        RiskEvaluationRequest req = RiskEvaluationRequest.builder()
                .latitude(25.1234) // Haflong corridor
                .longitude(92.5678)
                .rainfallMm24h(145.0)
                .roadCondition("SEVERELY_DAMAGED")
                .build();

        RiskEvaluationResponse resp = riskEngineService.evaluateRealTimeRisk(req);

        assertEquals("HIGH", resp.getCurrentRiskLevel());
        assertEquals("DEMPSTER_SHAFER_FUSED", resp.getAssessmentType());
        assertNotNull(resp.getConfidenceScore());
        assertTrue(resp.getCurrentRiskScore() >= 61 && resp.getCurrentRiskScore() <= 80);
    }

    @Test
    void testCriticalRiskScenario() {
        Incident activeLandslide = Incident.builder()
                .id(1L)
                .type("LANDSLIDE")
                .reportedSeverity("CRITICAL")
                .status("ACTIVE")
                .build();

        when(incidentRepository.findIncidentsNearLocation(anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(List.of(activeLandslide));

        RiskEvaluationRequest req = RiskEvaluationRequest.builder()
                .latitude(25.1234) // Haflong corridor
                .longitude(92.5678)
                .rainfallMm24h(145.0)
                .roadCondition("SEVERELY_DAMAGED")
                .build();

        RiskEvaluationResponse resp = riskEngineService.evaluateRealTimeRisk(req);

        assertEquals("CRITICAL", resp.getCurrentRiskLevel());
        assertEquals("DEMPSTER_SHAFER_FUSED", resp.getAssessmentType());
        assertNotNull(resp.getConfidenceScore());
        assertTrue(resp.getCurrentRiskScore() >= 81);
    }
}
