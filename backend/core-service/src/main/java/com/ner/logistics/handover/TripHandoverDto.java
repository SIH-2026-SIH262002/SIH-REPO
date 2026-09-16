package com.ner.logistics.handover;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripHandoverDto {

    private Long assistanceRequestId;

    @NotNull(message = "shipmentId is required")
    private Long shipmentId;

    private String vehicleCode;

    private Long originalDriverId;

    private String handoverLocationType; // CURRENT_VEHICLE_LOCATION or SAFE_HANDOVER_POINT

    private Double handoverLatitude;

    private Double handoverLongitude;

    private String handoverLocationName;

    private String handoverNotes;
}
