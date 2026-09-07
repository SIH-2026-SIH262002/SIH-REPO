package com.ner.logistics.recovery.controller;

import com.ner.logistics.decision.OperationalOutcome;
import com.ner.logistics.recovery.CorridorRecoveryHistory;
import com.ner.logistics.recovery.CorridorRecoveryPrediction;
import com.ner.logistics.recovery.dto.RecoveryOverrideDto;
import com.ner.logistics.recovery.dto.RerouteRecommendationDto;
import com.ner.logistics.recovery.service.CorridorRecoveryPredictionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CorridorRecoveryController {

    private final CorridorRecoveryPredictionService recoveryPredictionService;

    @PostMapping("/corridors/{corridorId}/recovery-prediction")
    @PreAuthorize("hasAuthority('INCIDENT_MANAGE') or hasAuthority('INCIDENT_VIEW')")
    public ResponseEntity<CorridorRecoveryPrediction> triggerRecoveryPrediction(
            @PathVariable String corridorId,
            @RequestParam(required = false) Long incidentId,
            @RequestParam(required = false) Double rainfall,
            @RequestParam(required = false) Integer severity) {

        log.info("⏱️ Triggering Recovery Prediction for Corridor {} (incidentId={}, rain={}mm/h)", corridorId, incidentId, rainfall);
        CorridorRecoveryPrediction prediction = recoveryPredictionService.generatePrediction(corridorId, incidentId, rainfall, severity);
        return ResponseEntity.ok(prediction);
    }

    @GetMapping("/corridors/{corridorId}/recovery-prediction/latest")
    @PreAuthorize("hasAuthority('INCIDENT_VIEW') or hasAuthority('INCIDENT_MANAGE')")
    public ResponseEntity<CorridorRecoveryPrediction> getLatestRecoveryPrediction(@PathVariable String corridorId) {
        CorridorRecoveryPrediction prediction = recoveryPredictionService.getLatestPrediction(corridorId);
        return ResponseEntity.ok(prediction);
    }

    @GetMapping("/corridors/{corridorId}/recovery-history")
    @PreAuthorize("hasAuthority('INCIDENT_VIEW') or hasAuthority('INCIDENT_MANAGE')")
    public ResponseEntity<List<CorridorRecoveryHistory>> getCorridorRecoveryHistory(@PathVariable String corridorId) {
        List<CorridorRecoveryHistory> history = recoveryPredictionService.getHistory(corridorId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/incidents/{incidentId}/reroute-recommendation")
    @PreAuthorize("hasAuthority('INCIDENT_VIEW') or hasAuthority('INCIDENT_MANAGE')")
    public ResponseEntity<RerouteRecommendationDto> getRerouteRecommendation(
            @PathVariable Long incidentId,
            @RequestParam(required = false) Double coldChainThermalBudgetHours) {

        RerouteRecommendationDto dto = recoveryPredictionService.getRerouteRecommendation(incidentId, coldChainThermalBudgetHours);
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/corridors/{corridorId}/recovery-feedback")
    @PreAuthorize("hasAuthority('INCIDENT_MANAGE') or hasAuthority('INCIDENT_STATUS_UPDATE')")
    public ResponseEntity<OperationalOutcome> recordRecoveryFeedback(
            @PathVariable String corridorId,
            @RequestParam Double actualClearanceHours,
            @RequestParam(required = false) String operatorNotes) {

        log.info("🔄 Recording Recovery Feedback for Corridor {}: actualClearanceHours={}", corridorId, actualClearanceHours);
        OperationalOutcome outcome = recoveryPredictionService.processRecoveryFeedback(corridorId, actualClearanceHours, operatorNotes);
        return ResponseEntity.ok(outcome);
    }

    @PostMapping("/corridors/{corridorId}/recovery-prediction/override")
    @PreAuthorize("hasAuthority('INCIDENT_MANAGE') or hasAuthority('EMERGENCY_DISPATCH')")
    public ResponseEntity<CorridorRecoveryPrediction> overridePrediction(
            @PathVariable String corridorId,
            @Valid @RequestBody RecoveryOverrideDto dto,
            Authentication authentication) {

        String username = authentication != null ? authentication.getName() : "OPERATOR_01";
        log.warn("🚨 Emergency Operator Override triggered by user {} for prediction {}", username, dto.getPredictionId());
        CorridorRecoveryPrediction updated = recoveryPredictionService.processOperatorOverride(dto, username);
        return ResponseEntity.ok(updated);
    }
}
