package com.ner.logistics.recovery.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecoveryOverrideDto {

    @NotNull
    private String predictionId;

    @NotNull
    private String overrideAction; // OVERRIDE_WAIT, OVERRIDE_REROUTE, OVERRIDE_HOLD

    private String operatorNotes;
}
