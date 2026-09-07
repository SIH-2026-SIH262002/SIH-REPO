package com.ner.logistics.sos;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;

@Entity
@Table(name = "sos_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SosEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String meshPacketId; // Unique offline P2P mesh identifier

    @Column(nullable = false)
    private String triggeredBy; // Driver / Officer username

    private String vehicleCode;

    @Column(columnDefinition = "geometry(Point,4326)")
    private Point location;

    private Double latitude;

    private Double longitude;

    private String emergencyType; // LANDSLIDE_TRAPPED, VEHICLE_BREAKDOWN, MEDICAL_EMERGENCY

    private String message;

    private String status; // TRIGGERED, RECEIVED, ACKNOWLEDGED, RESPONDER_ASSIGNED, RESOLVED

    private String assignedResponder;

    private String acknowledgedBy;

    private LocalDateTime acknowledgedAt;

    private LocalDateTime resolvedAt;

    private String resolutionNotes;

    @Builder.Default
    private String deliveryType = "DIRECT_CELLULAR"; // DIRECT_CELLULAR, MESH_RELAY_STORE_FORWARD

    private String relayedByVehicle; // Vehicle B code (e.g. NER-02)

    private Integer relayHopCount;

    private Long relayLatencyMinutes; // Latency between offline trigger and network flush

    private String pathAccumulator; // Relay vehicle lineage chain

    private String crcChecksum;

    private LocalDateTime originTimestamp;

    private LocalDateTime createdAt;
}

