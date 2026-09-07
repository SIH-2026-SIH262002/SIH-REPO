package com.ner.logistics.recovery;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "corridor_recovery_predictions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CorridorRecoveryPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String predictionId;

    @Column(nullable = false)
    private String corridorId;

    private Long incidentId;

    private Double predictedClearanceHours;

    private Double confidenceLowHours;

    private Double confidenceHighHours;

    private String recommendedAction; // WAIT, REROUTE, HOLD, EMERGENCY_REROUTE

    private String reasoningSummary;

    private Boolean isOverridden;

    private String overrideAction; // OVERRIDE_WAIT, OVERRIDE_REROUTE

    private String operatorNotes;

    private LocalDateTime generatedAt;

    private LocalDateTime expiresAt;
}
