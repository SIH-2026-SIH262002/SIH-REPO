package com.ner.logistics.sos;

import com.ner.logistics.user.User;
import com.ner.logistics.user.UserRole;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sos")
@RequiredArgsConstructor
public class SosController {

    private final SosService sosService;

    @PostMapping("/trigger")
    @PreAuthorize("hasAuthority('SOS_TRIGGER') or hasAuthority('SOS_VIEW')")
    public ResponseEntity<SosEvent> triggerSos(@Valid @RequestBody SosRequestDto dto, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "CONVOY_DRIVER";
        return ResponseEntity.ok(sosService.triggerSos(dto, username));
    }

    @PostMapping("/relay")
    public ResponseEntity<SosEvent> processRelayedSos(@Valid @RequestBody SosRelayRequestDto dto) {
        return ResponseEntity.ok(sosService.processRelayedSos(dto));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAuthority('SOS_VIEW') or hasAuthority('SOS_VIEW_SELF')")
    public ResponseEntity<List<SosEvent>> getActiveSosEvents(Authentication authentication) {
        List<SosEvent> events = sosService.getActiveSosEvents();
        if (authentication != null && authentication.getPrincipal() instanceof User u) {
            if (u.getRole() == UserRole.EMERGENCY_OPERATOR && u.getDistrict() != null && !u.getDistrict().trim().isEmpty()) {
                String operatorDistrict = u.getDistrict().trim().toLowerCase();
                List<SosEvent> filtered = events.stream()
                        .filter(s -> s.getDistrict() == null || s.getDistrict().trim().isEmpty() ||
                                s.getDistrict().toLowerCase().contains(operatorDistrict) ||
                                operatorDistrict.contains(s.getDistrict().toLowerCase()))
                        .toList();
                return ResponseEntity.ok(filtered);
            }
        }
        return ResponseEntity.ok(events);
    }

    @GetMapping("/nearby")
    @PreAuthorize("hasAuthority('SOS_VIEW')")
    public ResponseEntity<List<SosEvent>> getNearbySosEvents(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "25.0") double radiusKm) {
        // Location-Scoped SOS Awareness: Backend filters SOS events within radiusKm (default 25km)
        List<SosEvent> nearby = sosService.getActiveSosEvents().stream()
                .filter(s -> s.getLatitude() != null && s.getLongitude() != null)
                .filter(s -> calculateDistanceKm(lat, lng, s.getLatitude(), s.getLongitude()) <= radiusKm)
                .toList();
        return ResponseEntity.ok(nearby);
    }

    @GetMapping("/acks")
    public ResponseEntity<List<SosAck>> getActiveAcks() {
        return ResponseEntity.ok(sosService.getActiveAcks());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SOS_VIEW') or hasAuthority('SOS_VIEW_SELF')")
    public ResponseEntity<SosEvent> getSosById(@PathVariable Long id) {
        return ResponseEntity.ok(sosService.getSosById(id));
    }

    @PutMapping("/{id}/acknowledge")
    @PreAuthorize("hasAuthority('SOS_ACKNOWLEDGE')")
    public ResponseEntity<SosEvent> acknowledgeSos(@PathVariable Long id, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "CENTRAL_COMMAND";
        return ResponseEntity.ok(sosService.acknowledgeSos(id, username));
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAuthority('SOS_DISPATCH')")
    public ResponseEntity<SosEvent> assignResponder(@PathVariable Long id, @RequestParam(required = false) String responderName) {
        return ResponseEntity.ok(sosService.assignResponder(id, responderName));
    }

    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAuthority('SOS_RESOLVE')")
    public ResponseEntity<SosEvent> resolveSos(@PathVariable Long id, @RequestParam(required = false) String resolutionNotes) {
        return ResponseEntity.ok(sosService.resolveSos(id, resolutionNotes));
    }

    private double calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        double p = 0.017453292519943295; // Math.PI / 180
        double a = 0.5 - Math.cos((lat2 - lat1) * p)/2 +
                Math.cos(lat1 * p) * Math.cos(lat2 * p) *
                        (1 - Math.cos((lon2 - lon1) * p))/2;
        return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
    }
}
