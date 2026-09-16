package com.ner.logistics.handover;

import com.ner.logistics.driver.DriverProfile;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "trip_handovers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripHandover {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String handoverNumber; // e.g. HND-2026-0001

    private Long assistanceRequestId; // Link to originating AssistanceRequest if applicable

    @Column(nullable = false)
    private Long shipmentId; // References Shipment.id

    @Column(nullable = false)
    private String vehicleCode; // References Vehicle.code (e.g. NER-07)

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "original_driver_id", nullable = false)
    private DriverProfile originalDriver;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "replacement_driver_id")
    private DriverProfile replacementDriver; // Nullable until assigned

    @Column(nullable = false)
    @Builder.Default
    private String handoverLocationType = "CURRENT_VEHICLE_LOCATION"; // CURRENT_VEHICLE_LOCATION or SAFE_HANDOVER_POINT

    private Double handoverLatitude;

    private Double handoverLongitude;

    private String handoverLocationName;

    private Double estimatedDistanceKm; // Real road distance via GraphHopper

    private Integer estimatedArrivalMinutes; // Real travel duration via GraphHopper

    @Builder.Default
    private Boolean isFallbackEstimate = false; // True only if routing engine was unreachable

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING_REPLACEMENT"; // PENDING_REPLACEMENT, REPLACEMENT_OFFERED, ACCEPTED, IN_TRANSIT_TO_HANDOVER, ARRIVED, COMPLETED, REJECTED, CANCELLED

    @Builder.Default
    private Boolean cargoSealVerified = false;

    @Builder.Default
    private Boolean keysTransferred = false;

    @Builder.Default
    private Boolean vehicleInspectionPassed = false;

    @Column(length = 2000)
    private String handoverNotes;

    private String initiatedBy;

    private LocalDateTime completedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "PENDING_REPLACEMENT";
        }
        if (this.handoverLocationType == null) {
            this.handoverLocationType = "CURRENT_VEHICLE_LOCATION";
        }
        if (this.cargoSealVerified == null) this.cargoSealVerified = false;
        if (this.keysTransferred == null) this.keysTransferred = false;
        if (this.vehicleInspectionPassed == null) this.vehicleInspectionPassed = false;
    }
}
