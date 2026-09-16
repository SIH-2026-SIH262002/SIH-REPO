package com.ner.logistics.handover;

import jakarta.validation.constraints.AssertTrue;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HandoverChecklistDto {

    @AssertTrue(message = "Cargo seal verification is mandatory")
    private boolean cargoSealVerified;

    @AssertTrue(message = "Keys transfer verification is mandatory")
    private boolean keysTransferred;

    @AssertTrue(message = "Vehicle inspection verification is mandatory")
    private boolean vehicleInspectionPassed;

    private String notes;
}
