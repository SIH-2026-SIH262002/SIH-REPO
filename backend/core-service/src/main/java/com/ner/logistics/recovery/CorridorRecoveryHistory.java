package com.ner.logistics.recovery;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "corridor_recovery_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CorridorRecoveryHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String corridorId;

    private String blockageType; // LANDSLIDE, ROCKFALL, MUD_SLIDE, BRIDGE_RISK, FLOODING

    private Integer severityScore; // 0 to 100

    private Double rainfallMm;

    private String roadClassification;

    private String equipmentTypeUsed; // BULLDOZER_EXCAVATOR, HEAVY_CRANE, MANUAL_CLEARANCE

    private Double actualClearanceHours;

    private String weatherDuringClearance; // CONTINUOUS_RAIN, CLEAR, FOG

    private String season; // MONSOON, PRE_MONSOON, WINTER

    private LocalDateTime timestamp;
}
