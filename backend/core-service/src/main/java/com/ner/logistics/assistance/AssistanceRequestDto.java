package com.ner.logistics.assistance;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssistanceRequestDto {

    private Long driverId;

    private String vehicleCode;

    private Long shipmentId;

    private Long sosEventId;

    @NotBlank(message = "Category is required")
    private String category; // MEDICAL_EMERGENCY, VEHICLE_BREAKDOWN, UNABLE_TO_CONTINUE, HAZARD_BLOCKED, OTHER

    @NotBlank(message = "Severity is required")
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL

    private Double latitude;

    private Double longitude;

    private String locationDescription;

    private String operationalNotes; // Strictly operational observations
}
