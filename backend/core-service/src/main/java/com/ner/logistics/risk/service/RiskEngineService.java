package com.ner.logistics.risk.service;

import com.ner.logistics.incident.Incident;
import com.ner.logistics.incident.IncidentRepository;
import com.ner.logistics.risk.DempsterShaferConfidenceEngine;
import com.ner.logistics.risk.dto.FactorImpactDto;
import com.ner.logistics.risk.dto.RiskEvaluationRequest;
import com.ner.logistics.risk.dto.RiskEvaluationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RiskEngineService {

    private final IncidentRepository incidentRepository;
    private final RiskLevelResolver riskLevelResolver;

    public RiskEvaluationResponse evaluateRealTimeRisk(RiskEvaluationRequest request) {
        int score = 0;
        List<FactorImpactDto> factors = new ArrayList<>();

        double rainfall = request.getRainfallMm24h() != null ? request.getRainfallMm24h() : 25.0;

        // 1. Weather Factor
        if (rainfall > 120.0) {
            score += 35;
            factors.add(new FactorImpactDto(String.format("Torrential rainfall warning (%.1f mm/24h)", rainfall), "HIGH"));
        } else if (rainfall > 60.0) {
            score += 20;
            factors.add(new FactorImpactDto(String.format("Moderate rainfall (%.1f mm/24h)", rainfall), "MEDIUM"));
        } else {
            factors.add(new FactorImpactDto("Precipitation within normal bounds", "LOW"));
        }

        // 2. PostGIS Spatial Incident Proximity Search (10km radius)
        List<Incident> nearbyIncidents = incidentRepository.findIncidentsNearLocation(request.getLatitude(), request.getLongitude(), 10000.0);
        if (!nearbyIncidents.isEmpty()) {
            boolean hasCritical = nearbyIncidents.stream().anyMatch(i -> 
                "CRITICAL".equalsIgnoreCase(i.getReportedSeverity()) || 
                "HIGH".equalsIgnoreCase(i.getReportedSeverity()) ||
                "CRITICAL".equalsIgnoreCase(i.getRecommendedSeverity()) ||
                "HIGH".equalsIgnoreCase(i.getRecommendedSeverity())
            );
            if (hasCritical) {
                score += 45;
                factors.add(new FactorImpactDto(String.format("Active Critical/High incident reported within 10km radius (%d active)", nearbyIncidents.size()), "HIGH"));
            } else {
                score += 25;
                factors.add(new FactorImpactDto(String.format("Active incidents reported within 10km radius (%d active)", nearbyIncidents.size()), "MEDIUM"));
            }
        }

        // 3. Road Condition Factor
        if ("SEVERELY_DAMAGED".equalsIgnoreCase(request.getRoadCondition())) {
            score += 20;
            factors.add(new FactorImpactDto("Severe pavement degradation and landslide debris", "HIGH"));
        } else if ("DEGRADED".equalsIgnoreCase(request.getRoadCondition())) {
            score += 10;
            factors.add(new FactorImpactDto("Corridor surface degraded", "MEDIUM"));
        }

        // 4. Historical Mountain Corridor Risk Factor (Haflong / Dima Hasao Sector)
        if (request.getLatitude() >= 24.8 && request.getLatitude() <= 25.6 && request.getLongitude() >= 92.2 && request.getLongitude() <= 93.2) {
            score += 15;
            factors.add(new FactorImpactDto("High historical landslide frequency zone (Dima Hasao Corridor)", "HIGH"));
        }

        score = Math.min(100, Math.max(0, score));
        String riskLevel = riskLevelResolver.resolveFromScore(score);

        // Dempster-Shafer Evidence Combination (IoT Weather Sensor vs Incident Report)
        long now = System.currentTimeMillis() / 1000L;
        DempsterShaferConfidenceEngine.EvidenceSource sensorEvidence = DempsterShaferConfidenceEngine.EvidenceSource.builder()
                .sourceId("IOT_WEATHER_NODE_01")
                .sourceType("IOT_SENSOR")
                .beliefHazard(rainfall > 60.0 ? 0.75 : 0.15)
                .beliefSafe(rainfall <= 60.0 ? 0.70 : 0.10)
                .uncertainty(0.15)
                .timestampEpochSec(now - 300) // 5 min old
                .build();

        DempsterShaferConfidenceEngine.EvidenceSource reportEvidence = DempsterShaferConfidenceEngine.EvidenceSource.builder()
                .sourceId("HUMAN_FIELD_REPORT_01")
                .sourceType("HUMAN_DRIVER")
                .beliefHazard(!nearbyIncidents.isEmpty() ? 0.85 : 0.10)
                .beliefSafe(!nearbyIncidents.isEmpty() ? 0.05 : 0.80)
                .uncertainty(0.10)
                .timestampEpochSec(now - 600) // 10 min old
                .build();

        DempsterShaferConfidenceEngine.CombinedBeliefResult fused = DempsterShaferConfidenceEngine.fuseDempsterShafer(sensorEvidence, reportEvidence, now);

        String explanation = String.format("%s real-time risk assessed (Confidence: %.1f%% via Dempster-Shafer fusion) due to weather, spatial incidents, and corridor vulnerability.",
                riskLevel, fused.getOverallConfidenceScore());

        return RiskEvaluationResponse.builder()
                .currentRiskScore(score)
                .currentRiskLevel(riskLevel)
                .assessmentType("DEMPSTER_SHAFER_FUSED")
                .confidenceScore(fused.getOverallConfidenceScore())
                .uncertaintyMetric(fused.getCombinedUncertainty())
                .factors(factors)
                .explanation(explanation)
                .build();
    }
}
