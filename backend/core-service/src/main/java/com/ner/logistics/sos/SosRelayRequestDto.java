package com.ner.logistics.sos;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SosRelayRequestDto {

    @NotNull
    private String meshPacketId; // Unique offline P2P mesh UUID

    @NotNull
    private String originVehicleCode; // Stuck vehicle (Device A e.g. NER-07)

    @NotNull
    private Double originLatitude;

    @NotNull
    private Double originLongitude;

    private String emergencyType; // LANDSLIDE_TRAPPED, MEDICAL_CRITICAL, VEHICLE_BREAKDOWN

    private String message;

    private LocalDateTime originTimestamp; // Exact time SOS was triggered offline in shadow zone

    @NotNull
    private String relayedByVehicleCode; // Passing vehicle (Device B e.g. NER-02)

    private Double relayLatitude; // GPS location where Device B picked up network signal

    private Double relayLongitude;

    @Builder.Default
    private Integer hopCount = 1;

    private String pathAccumulator; // Comma-separated chain of vehicle codes (e.g. NER-07 -> NER-02 -> NER-05)

    private String crcChecksum;
}
