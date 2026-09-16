package com.ner.logistics.driver;

import com.ner.logistics.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "driver_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriverProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user; // Authentic User identity with role DRIVER

    @Column(unique = true, nullable = false)
    private String licenseNumber; // e.g. AS-01-2022-0049281

    @Column(nullable = false)
    private String licenseCategory; // TRANS_HEAVY, HMV, HAZMAT, LIGHT_COMMERCIAL

    private LocalDate licenseExpiry;

    @Column(nullable = false)
    @Builder.Default
    private String operationalStatus = "REGISTERED"; // REGISTERED, VERIFIED, ACTIVE, ON_TRIP, HANDOVER_REQUIRED, OFF_DUTY, SUSPENDED

    @Column(nullable = false)
    @Builder.Default
    private String fitnessStatus = "FIT"; // FIT, UNABLE_TO_CONTINUE, RESTRICTED_DUTY (operational fitness only)

    private String baseDepot; // e.g. Guwahati Central Hub, Silchar Logistics Depot, Haflong Outpost

    private Double currentLatitude;

    private Double currentLongitude;

    private LocalDateTime lastLocationUpdate;

    private String assignedVehicleCode; // References Vehicle.code (e.g. NER-07)

    private Long activeShipmentId; // References Shipment.id

    private String emergencyContactName;

    private String emergencyContactPhone;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.operationalStatus == null) {
            this.operationalStatus = "REGISTERED";
        }
        if (this.fitnessStatus == null) {
            this.fitnessStatus = "FIT";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
