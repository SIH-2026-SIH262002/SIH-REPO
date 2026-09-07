package com.ner.logistics.decision;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Operational outcome feedback entity.
 * Addresses Architecture Review Item #3: Tracks prediction vs decision vs real-world outcome to complete the LEARN feedback loop.
 */
@Entity
@Table(name = "operational_outcomes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperationalOutcome {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String predictionId;
    private String corridorId;

    private String predictedCategory; // HIGH, SEVERE, MODERATE
    private Double predictedScore;

    private String decisionTaken; // REROUTED, PROCEEDED, STOPPED

    private String actualOutcome; // BLOCKED_BY_LANDSLIDE, PASSABLE_NO_HAZARD, MINOR_DELAY

    private String feedbackNotes;
    private String operatorId;

    private Boolean isFalsePositive;
    private Boolean isFalseNegative;

    private LocalDateTime outcomeTimestamp;
}
