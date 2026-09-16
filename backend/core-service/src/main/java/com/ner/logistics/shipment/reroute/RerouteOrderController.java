package com.ner.logistics.shipment.reroute;

import com.ner.logistics.user.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reroutes")
public class RerouteOrderController {

    private final RerouteOrderService service;

    @Autowired
    public RerouteOrderController(RerouteOrderService service) {
        this.service = service;
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAuthority('ROUTE_VIEW') or hasAuthority('DECISION_VIEW')")
    public ResponseEntity<List<RerouteOrder>> getPendingReroutes() {
        return ResponseEntity.ok(service.getPendingReroutes());
    }

    @PostMapping("/approve")
    @PreAuthorize("hasAuthority('ROUTE_APPROVE') or hasAuthority('DECISION_APPROVE')")
    public ResponseEntity<RerouteOrder> approveReroute(@RequestBody Map<String, Object> body,
                                                        @AuthenticationPrincipal User actor) {
        if (body.get("id") == null) {
            return ResponseEntity.badRequest().build();
        }
        Long id = Long.valueOf(body.get("id").toString());
        String selectedCorridor = (String) body.get("selectedCorridor");
        String instructions = (String) body.get("instructions");
        if (selectedCorridor == null || selectedCorridor.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        String operator = actor != null ? actor.getUsername() : "SYSTEM";

        return service.approveReroute(id, selectedCorridor, instructions, operator)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/reject")
    @PreAuthorize("hasAuthority('ROUTE_APPROVE') or hasAuthority('DECISION_APPROVE')")
    public ResponseEntity<RerouteOrder> rejectReroute(@RequestBody Map<String, Object> body,
                                                       @AuthenticationPrincipal User actor) {
        if (body.get("id") == null) {
            return ResponseEntity.badRequest().build();
        }
        Long id = Long.valueOf(body.get("id").toString());
        String reason = (String) body.getOrDefault("reason", "Hold in convoy until road cleared.");
        String operator = actor != null ? actor.getUsername() : "SYSTEM";

        return service.rejectReroute(id, reason, operator)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/emergency-override")
    @PreAuthorize("hasAuthority('EMERGENCY_CORRIDOR_MANAGE')")
    public ResponseEntity<RerouteOrder> emergencyOverride(@RequestBody Map<String, Object> body,
                                                           @AuthenticationPrincipal User actor) {
        if (body.get("id") == null) {
            return ResponseEntity.badRequest().build();
        }
        Long id = Long.valueOf(body.get("id").toString());
        String action = (String) body.getOrDefault("action", "FORCE_EMERGENCY_REROUTE");
        String operator = actor != null ? actor.getUsername() : "SYSTEM";

        return service.emergencyOverride(id, action, operator)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/drivers/{vehicleCode}/instructions")
    @PreAuthorize("hasAuthority('ROUTE_APPROVE') or hasAuthority('DECISION_APPROVE')")
    public ResponseEntity<Map<String, String>> sendDriverInstructions(
            @PathVariable String vehicleCode,
            @RequestBody Map<String, String> body) {
        String instructions = body.get("instructions");
        if (instructions == null || instructions.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        // No SMS/WhatsApp gateway is wired up yet -- this only records the
        // dispatch intent server-side, it does not actually reach the driver.
        return ResponseEntity.ok(Map.of(
                "vehicleCode", vehicleCode,
                "status", "NOT_IMPLEMENTED",
                "instructions", instructions,
                "channel", "NONE_CONFIGURED"
        ));
    }
}
