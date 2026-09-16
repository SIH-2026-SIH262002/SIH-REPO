package com.ner.logistics.assistance;

import com.ner.logistics.driver.DriverProfile;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "assistance_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssistanceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String requestNumber; // e.g. AST-2026-0001

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "driver_id", nullable = false)
    private DriverProfile driver;

    private String vehicleCode; // References Vehicle.code (e.g. NER-07)

    private Long shipmentId; // References Shipment.id

    private Long sosEventId; // References SosEvent.id when linked to emergency SOS

    @Column(nullable = false)
    private String category; // MEDICAL_EMERGENCY, VEHICLE_BREAKDOWN, UNABLE_TO_CONTINUE, HAZARD_BLOCKED, OTHER

    @Column(nullable = false)
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(nullable = false)
    @Builder.Default
    private String status = "OPEN"; // OPEN, ACKNOWLEDGED, ASSISTANCE_DISPATCHED, HANDOVER_REQUESTED, RESOLVED, CANCELLED

    private Double latitude;

    private Double longitude;

    private String locationDescription;

    @Column(length = 2000)
    private String operationalNotes; // Strictly operational context, NO clinical diagnoses

    private String acknowledgedBy;

    private LocalDateTime acknowledgedAt;

    private String dispatchedAction;

    private String cancelledBy;

    private LocalDateTime cancelledAt;

    @Column(length = 1000)
    private String cancellationNotes;

    private String resolvedBy;

    private LocalDateTime resolvedAt;

    @Column(length = 2000)
    private String resolutionNotes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "OPEN";
        }
    }
}
