package com.ner.logistics.shipment.reroute;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<List<RerouteOrder>> getPendingReroutes() {
        return ResponseEntity.ok(service.getPendingReroutes());
    }

    @PostMapping("/approve")
    public ResponseEntity<RerouteOrder> approveReroute(@RequestBody Map<String, Object> body) {
        Long id = body.get("id") != null ? Long.valueOf(body.get("id").toString()) : 1L;
        String selectedCorridor = (String) body.getOrDefault("selectedCorridor", "SH-51_BYPASS");
        String instructions = (String) body.getOrDefault("instructions", "Proceed via Umrangso bypass.");
        String operator = (String) body.getOrDefault("operatorUsername", "LOGISTICS_OPERATOR_01");

        return ResponseEntity.ok(service.approveReroute(id, selectedCorridor, instructions, operator));
    }

    @PostMapping("/reject")
    public ResponseEntity<RerouteOrder> rejectReroute(@RequestBody Map<String, Object> body) {
        Long id = body.get("id") != null ? Long.valueOf(body.get("id").toString()) : 1L;
        String reason = (String) body.getOrDefault("reason", "Hold in convoy until road cleared.");
        String operator = (String) body.getOrDefault("operatorUsername", "LOGISTICS_OPERATOR_01");

        return ResponseEntity.ok(service.rejectReroute(id, reason, operator));
    }

    @PostMapping("/emergency-override")
    public ResponseEntity<RerouteOrder> emergencyOverride(@RequestBody Map<String, Object> body) {
        Long id = body.get("id") != null ? Long.valueOf(body.get("id").toString()) : 1L;
        String action = (String) body.getOrDefault("action", "FORCE_EMERGENCY_REROUTE");
        String operator = (String) body.getOrDefault("emergencyOperatorUsername", "EMERGENCY_COMMANDER_01");

        return ResponseEntity.ok(service.emergencyOverride(id, action, operator));
    }

    @PostMapping("/drivers/{vehicleCode}/instructions")
    public ResponseEntity<Map<String, String>> sendDriverInstructions(
            @PathVariable String vehicleCode,
            @RequestBody Map<String, String> body) {
        String instructions = body.getOrDefault("instructions", "Follow assigned corridor.");
        return ResponseEntity.ok(Map.of(
                "vehicleCode", vehicleCode,
                "status", "DISPATCHED",
                "instructions", instructions,
                "channel", "TWILIO_SMS_MOCK"
        ));
    }
}
