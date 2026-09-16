package com.ner.logistics.handover;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/handovers")
@RequiredArgsConstructor
public class TripHandoverController {

    private final TripHandoverService tripHandoverService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('LOGISTICS_OPERATOR') or hasRole('DRIVER')")
    public ResponseEntity<List<TripHandover>> getHandovers(
            @RequestParam(required = false, defaultValue = "false") boolean all) {
        return ResponseEntity.ok(all ? tripHandoverService.getAllHandovers() : tripHandoverService.getActiveHandovers());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LOGISTICS_OPERATOR') or hasRole('DRIVER')")
    public ResponseEntity<TripHandover> getHandoverById(@PathVariable Long id) {
        return ResponseEntity.ok(tripHandoverService.getHandoverById(id));
    }

    @GetMapping("/{id}/candidates")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LOGISTICS_OPERATOR')")
    public ResponseEntity<List<CandidateDriverDto>> getCandidateDrivers(@PathVariable Long id) {
        return ResponseEntity.ok(tripHandoverService.getCandidateDrivers(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('LOGISTICS_OPERATOR')")
    public ResponseEntity<TripHandover> initiateHandover(
            @Valid @RequestBody TripHandoverDto dto,
            Authentication authentication) {
        String operator = authentication != null ? authentication.getName() : "LOGISTICS_OPERATOR";
        return ResponseEntity.ok(tripHandoverService.initiateHandover(dto, operator));
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LOGISTICS_OPERATOR')")
    public ResponseEntity<TripHandover> assignReplacementDriver(
            @PathVariable Long id,
            @RequestBody Map<String, Long> body,
            Authentication authentication) {
        Long replacementDriverId = body.get("replacementDriverId");
        if (replacementDriverId == null) {
            throw new IllegalArgumentException("Field 'replacementDriverId' is required");
        }
        String operator = authentication != null ? authentication.getName() : "LOGISTICS_OPERATOR";
        return ResponseEntity.ok(tripHandoverService.assignReplacementDriver(id, replacementDriverId, operator));
    }

    @PutMapping("/{id}/accept")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<TripHandover> acceptHandover(
            @PathVariable Long id,
            Authentication authentication) {
        String driverUsername = authentication.getName();
        return ResponseEntity.ok(tripHandoverService.acceptHandover(id, driverUsername));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<TripHandover> rejectHandover(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        String reason = body != null ? body.get("reason") : null;
        String driverUsername = authentication.getName();
        return ResponseEntity.ok(tripHandoverService.rejectHandover(id, reason, driverUsername));
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LOGISTICS_OPERATOR')")
    public ResponseEntity<TripHandover> completeHandover(
            @PathVariable Long id,
            @Valid @RequestBody HandoverChecklistDto checklist,
            Authentication authentication) {
        String operator = authentication != null ? authentication.getName() : "LOGISTICS_OPERATOR";
        return ResponseEntity.ok(tripHandoverService.completeHandover(id, checklist, operator));
    }
}
