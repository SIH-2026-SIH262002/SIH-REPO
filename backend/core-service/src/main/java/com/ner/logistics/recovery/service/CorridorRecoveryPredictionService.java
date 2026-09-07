package com.ner.logistics.recovery.service;

import com.ner.logistics.decision.OperationalOutcome;
import com.ner.logistics.decision.OperationalOutcomeRepository;
import com.ner.logistics.incident.Incident;
import com.ner.logistics.incident.IncidentRepository;
import com.ner.logistics.recovery.*;
import com.ner.logistics.recovery.dto.RecoveryOverrideDto;
import com.ner.logistics.recovery.dto.RecoveryPredictionDto;
import com.ner.logistics.recovery.dto.RerouteRecommendationDto;
import com.ner.logistics.recovery.engine.*;
import com.ner.logistics.shipment.SupplyCriticalityCalculator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CorridorRecoveryPredictionService {

    private final CorridorProfileRepository profileRepository;
    private final CorridorRecoveryHistoryRepository historyRepository;
    private final CorridorRecoveryPredictionRepository predictionRepository;
    private final OperationalOutcomeRepository outcomeRepository;
    private final IncidentRepository incidentRepository;
    private final BaseClearanceEstimator baseClearanceEstimator;
    private final SeverityMultiplierEngine severityMultiplierEngine;
    private final WeatherContractAdapter weatherContractAdapter;
    private final WeatherPenaltyEngine weatherPenaltyEngine;
    private final InfrastructurePriorityModifier infrastructurePriorityModifier;
    private final ConfidenceIntervalGenerator confidenceIntervalGenerator;
    private final DecisionRecommender decisionRecommender;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public CorridorRecoveryPrediction generatePrediction(String corridorId, Long incidentId, Double liveRainfall, Integer overrideSeverity) {
        CorridorProfile profile = profileRepository.findByCorridorId(corridorId)
                .orElseGet(() -> CorridorProfile.builder()
                        .corridorId(corridorId)
                        .name("Corridor " + corridorId)
                        .roadClassification("STATE_HIGHWAY")
                        .terrainType("STEEP_MOUNTAIN")
                        .averageSlopeDeg(12.0)
                        .depotDistanceKm(25.0)
                        .historicalBlockageCount(0)
                        .build());

        List<CorridorRecoveryHistory> historyList = historyRepository.findByCorridorId(corridorId);

        // Fetch Incident severity
        int severity = 70;
        String blockageType = "LANDSLIDE";
        if (incidentId != null) {
            Incident incident = incidentRepository.findById(incidentId).orElse(null);
            if (incident != null) {
                blockageType = incident.getType() != null ? incident.getType() : "LANDSLIDE";
                severity = "CRITICAL".equalsIgnoreCase(incident.getReportedSeverity()) ? 90 : 65;
            }
        }
        if (overrideSeverity != null) {
            severity = overrideSeverity;
        }

        // 1. Base Clearance Estimator
        double baseHours = baseClearanceEstimator.estimateBaseClearanceHours(blockageType, profile.getRoadClassification(), historyList);

        // 2. Non-linear Severity Multiplier
        double severityMult = severityMultiplierEngine.calculateSeverityMultiplier(severity);

        // 3. Weather Penalty Engine
        WeatherContractAdapter.WeatherReading weather = weatherContractAdapter.fetchWeatherContract(25.1234, 92.5678, liveRainfall);
        double weatherPenalty = weatherPenaltyEngine.calculateWeatherPenaltyHours(weather);

        // 4. Infrastructure Priority Modifier
        double infraModifier = infrastructurePriorityModifier.calculateInfrastructureModifierHours(profile.getRoadClassification(), profile.getDepotDistanceKm());

        // Formula Calculation: (Base * SeverityMult) + WeatherPenalty + InfraModifier
        double predictedClearance = (baseHours * severityMult) + weatherPenalty + infraModifier;
        predictedClearance = Math.max(1.0, Math.round(predictedClearance * 10.0) / 10.0);

        // 5. Confidence Interval Generator
        ConfidenceIntervalGenerator.ConfidenceBounds bounds = confidenceIntervalGenerator.generateBounds(predictedClearance, historyList.size());

        // 6. Decision Recommender
        DecisionRecommender.DecisionInput decisionInput = DecisionRecommender.DecisionInput.builder()
                .predictedClearanceHours(predictedClearance)
                .alternateRouteTimeHours(null) // Dual mode heuristic fallback if router offline
                .directDistanceKm(profile.getDepotDistanceKm() != null ? profile.getDepotDistanceKm() * 3.0 : 90.0)
                .shipmentCriticality("HIGH")
                .coldChainThermalBudgetHours(null)
                .build();

        DecisionRecommender.DecisionOutput decision = decisionRecommender.recommendAction(decisionInput);

        String predId = "PRED-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        LocalDateTime now = LocalDateTime.now();

        CorridorRecoveryPrediction entity = CorridorRecoveryPrediction.builder()
                .predictionId(predId)
                .corridorId(corridorId)
                .incidentId(incidentId)
                .predictedClearanceHours(predictedClearance)
                .confidenceLowHours(bounds.getConfidenceLowHours())
                .confidenceHighHours(bounds.getConfidenceHighHours())
                .recommendedAction(decision.getRecommendedAction())
                .reasoningSummary(decision.getReasoningSummary())
                .isOverridden(false)
                .generatedAt(now)
                .expiresAt(now.plusHours(6))
                .build();

        CorridorRecoveryPrediction saved = predictionRepository.save(entity);
        log.info("⏱️ Corridor Recovery Prediction Generated: {} -> {} hrs [Range: {}-{} hrs], Action={}",
                corridorId, predictedClearance, bounds.getConfidenceLowHours(), bounds.getConfidenceHighHours(), decision.getRecommendedAction());

        messagingTemplate.convertAndSend("/topic/recovery-predictions", saved);
        return saved;
    }

    public CorridorRecoveryPrediction getLatestPrediction(String corridorId) {
        return predictionRepository.findTopByCorridorIdOrderByGeneratedAtDesc(corridorId)
                .orElseGet(() -> generatePrediction(corridorId, null, null, null));
    }

    public List<CorridorRecoveryHistory> getHistory(String corridorId) {
        return historyRepository.findByCorridorId(corridorId);
    }

    @Transactional
    public RerouteRecommendationDto getRerouteRecommendation(Long incidentId, Double coldChainThermalBudget) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found with ID: " + incidentId));

        String corridorId = incident.getLocationName() != null ? incident.getLocationName() : "NH-27_HAFLONG_PASS";
        CorridorRecoveryPrediction prediction = getLatestPrediction(corridorId);

        // Compute criticality
        SupplyCriticalityCalculator.CriticalityInput criticalityInput = SupplyCriticalityCalculator.CriticalityInput.builder()
                .commodityType("MEDICAL_OXYGEN")
                .totalShelfLifeHours(48.0)
                .remainingShelfLifeHours(18.0)
                .destinationInventoryDeficitRatio(0.85)
                .populationServedFactor(8.0)
                .build();

        SupplyCriticalityCalculator.CriticalityResult criticality = SupplyCriticalityCalculator.calculateCriticality(criticalityInput);

        DecisionRecommender.DecisionInput decisionInput = DecisionRecommender.DecisionInput.builder()
                .predictedClearanceHours(prediction.getPredictedClearanceHours())
                .alternateRouteTimeHours(null)
                .directDistanceKm(110.0)
                .shipmentCriticality(criticality.getPriorityTier())
                .coldChainThermalBudgetHours(coldChainThermalBudget)
                .build();

        DecisionRecommender.DecisionOutput decision = decisionRecommender.recommendAction(decisionInput);

        return RerouteRecommendationDto.builder()
                .incidentId(incidentId)
                .corridorId(corridorId)
                .predictionId(prediction.getPredictionId())
                .predictedClearanceHours(prediction.getPredictedClearanceHours())
                .confidenceLowHours(prediction.getConfidenceLowHours())
                .confidenceHighHours(prediction.getConfidenceHighHours())
                .recommendedAction(decision.getRecommendedAction())
                .reasoningSummary(decision.getReasoningSummary())
                .shipmentCriticalityTier(criticality.getPriorityTier())
                .criticalityScore(criticality.getCriticalityScore())
                .coldChainThermalBudgetHours(coldChainThermalBudget)
                .routeEstimationMode(decision.getRouteEstimationMode())
                .build();
    }

    @Transactional
    public OperationalOutcome processRecoveryFeedback(String corridorId, Double actualClearanceHours, String operatorNotes) {
        CorridorRecoveryPrediction prediction = getLatestPrediction(corridorId);

        CorridorRecoveryHistory history = CorridorRecoveryHistory.builder()
                .corridorId(corridorId)
                .blockageType("LANDSLIDE")
                .severityScore(75)
                .actualClearanceHours(actualClearanceHours)
                .weatherDuringClearance("CLEAR")
                .season("MONSOON")
                .timestamp(LocalDateTime.now())
                .build();
        historyRepository.save(history);

        boolean isFalsePositive = actualClearanceHours < (prediction.getPredictedClearanceHours() * 0.5);
        boolean isFalseNegative = actualClearanceHours > (prediction.getPredictedClearanceHours() * 1.8);

        OperationalOutcome outcome = OperationalOutcome.builder()
                .predictionId(prediction.getPredictionId())
                .corridorId(corridorId)
                .predictedCategory(prediction.getPredictedClearanceHours() > 20 ? "SEVERE" : "HIGH")
                .predictedScore(prediction.getPredictedClearanceHours())
                .decisionTaken(prediction.getRecommendedAction())
                .actualOutcome(isFalsePositive ? "FAST_CLEARANCE" : (isFalseNegative ? "EXTENDED_BLOCKAGE" : "NORMAL_CLEARANCE"))
                .isFalsePositive(isFalsePositive)
                .isFalseNegative(isFalseNegative)
                .feedbackNotes(operatorNotes != null ? operatorNotes : "Recovery feedback logged by Emergency Operator")
                .operatorId("OPERATOR_01")
                .outcomeTimestamp(LocalDateTime.now())
                .build();

        log.info("🔄 Operational Feedback Logged for Corridor {}: Actual clearance={}h (Predicted={}h)",
                corridorId, actualClearanceHours, prediction.getPredictedClearanceHours());

        return outcomeRepository.save(outcome);
    }

    @Transactional
    public CorridorRecoveryPrediction processOperatorOverride(RecoveryOverrideDto dto, String username) {
        CorridorRecoveryPrediction prediction = predictionRepository.findByPredictionId(dto.getPredictionId())
                .orElseThrow(() -> new IllegalArgumentException("Prediction not found with ID: " + dto.getPredictionId()));

        prediction.setIsOverridden(true);
        prediction.setOverrideAction(dto.getOverrideAction());
        prediction.setOperatorNotes(dto.getOperatorNotes());
        prediction.setRecommendedAction(dto.getOverrideAction());

        CorridorRecoveryPrediction updated = predictionRepository.save(prediction);
        log.warn("🚨 EMERGENCY OPERATOR OVERRIDE: Prediction {} overridden to {} by user {}. Notes: {}",
                dto.getPredictionId(), dto.getOverrideAction(), username, dto.getOperatorNotes());

        messagingTemplate.convertAndSend("/topic/recovery-predictions", updated);
        return updated;
    }
}
