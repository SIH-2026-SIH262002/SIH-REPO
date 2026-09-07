package com.ner.logistics.recovery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecoveryPredictionDto {

    private String predictionId;
    private String corridorId;
    private Long incidentId;
    private Double predictedClearanceHours;
    private Double confidenceLowHours;
    private Double confidenceHighHours;
    private String recommendedAction;
    private String reasoningSummary;
    private Boolean isOverridden;
    private String overrideAction;
    private LocalDateTime generatedAt;
    private LocalDateTime expiresAt;
}
