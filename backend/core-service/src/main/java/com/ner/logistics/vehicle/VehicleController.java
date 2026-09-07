package com.ner.logistics.vehicle;

import com.ner.logistics.audit.AuditService;
import com.ner.logistics.user.User;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;
    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasAuthority('VEHICLE_VIEW') or hasAuthority('VEHICLE_MANAGE')")
    public ResponseEntity<List<Vehicle>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    @GetMapping("/{code}")
    @PreAuthorize("hasAuthority('VEHICLE_VIEW') or hasAuthority('VEHICLE_MANAGE')")
    public ResponseEntity<Vehicle> getVehicleByCode(@PathVariable String code) {
        return ResponseEntity.ok(vehicleService.getVehicleByCode(code));
    }

    @GetMapping("/{code}/journey-details")
    public ResponseEntity<com.ner.logistics.vehicle.dto.VehicleJourneyDetailsDto> getVehicleJourneyDetails(@PathVariable String code) {
        return ResponseEntity.ok(vehicleService.getJourneyDetailsByCode(code));
    }

    @PutMapping("/{code}/status")
    @PreAuthorize("hasAuthority('VEHICLE_MANAGE')")
    public ResponseEntity<?> updateVehicleStatus(@PathVariable String code,
                                                 @RequestBody Map<String, String> body,
                                                 @AuthenticationPrincipal User actor) {
        String status = body.get("status");
        String justificationReason = body.get("justificationReason");

        Vehicle vehicle = vehicleService.updateVehicleStatus(code, status);
        auditService.logDetailedEvent(
                actor != null ? actor.getUsername() : "SYSTEM",
                actor != null ? actor.getRole().name() : "LOGISTICS_OPERATOR",
                "VEHICLE_STATUS_UPDATED",
                "Vehicle",
                code,
                vehicle.getStatus(),
                status,
                justificationReason != null ? justificationReason : "Status updated to " + status,
                null,
                "SUCCESS"
        );
        return ResponseEntity.ok(vehicle);
    }

    @PostMapping("/{code}/assign-driver")
    @PreAuthorize("hasAuthority('VEHICLE_MANAGE')")
    public ResponseEntity<?> assignDriver(@PathVariable String code,
                                          @RequestBody AssignDriverDto dto,
                                          @AuthenticationPrincipal User actor) {
        try {
            Vehicle vehicle = vehicleService.assignDriverToVehicle(code, dto.getDriverUsername());
            auditService.logDetailedEvent(
                    actor != null ? actor.getUsername() : "SYSTEM",
                    actor != null ? actor.getRole().name() : "LOGISTICS_OPERATOR",
                    "DRIVER_ASSIGNED_TO_VEHICLE",
                    "Vehicle",
                    code,
                    "UNASSIGNED",
                    dto.getDriverUsername(),
                    "Assigned driver " + dto.getDriverUsername() + " to vehicle " + code,
                    null,
                    "SUCCESS"
            );
            return ResponseEntity.ok(vehicle);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{code}/unassign-driver")
    @PreAuthorize("hasAuthority('VEHICLE_MANAGE')")
    public ResponseEntity<?> unassignDriver(@PathVariable String code,
                                            @AuthenticationPrincipal User actor) {
        Vehicle vehicle = vehicleService.unassignDriver(code);
        auditService.logDetailedEvent(
                actor != null ? actor.getUsername() : "SYSTEM",
                actor != null ? actor.getRole().name() : "LOGISTICS_OPERATOR",
                "DRIVER_UNASSIGNED_FROM_VEHICLE",
                "Vehicle",
                code,
                "ASSIGNED",
                "UNASSIGNED",
                "Unassigned driver from vehicle " + code,
                null,
                "SUCCESS"
        );
        return ResponseEntity.ok(vehicle);
    }

    @Data
    public static class AssignDriverDto {
        private String driverUsername;
    }
}
