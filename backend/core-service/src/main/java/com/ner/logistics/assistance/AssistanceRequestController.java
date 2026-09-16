package com.ner.logistics.assistance;

import com.ner.logistics.user.User;
import com.ner.logistics.user.UserRole;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assistance")
@RequiredArgsConstructor
public class AssistanceRequestController {

    private final AssistanceRequestService assistanceRequestService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('LOGISTICS_OPERATOR') or hasRole('EMERGENCY_OPERATOR') or hasRole('DRIVER')")
    public ResponseEntity<List<AssistanceRequest>> getAssistanceRequests(
            @RequestParam(required = false) String status,
            Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof User u && u.getRole() == UserRole.DRIVER) {
            // Driver only views their own requests or active ones
            return ResponseEntity.ok(assistanceRequestService.getActiveRequests().stream()
                    .filter(r -> r.getDriver().getUser().getUsername().equalsIgnoreCase(u.getUsername()))
                    .toList());
        }
        if (status != null && !status.isBlank()) {
            return ResponseEntity.ok(assistanceRequestService.getAllRequests().stream()
                    .filter(r -> status.equalsIgnoreCase(r.getStatus()))
                    .toList());
        }
        return ResponseEntity.ok(assistanceRequestService.getActiveRequests());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LOGISTICS_OPERATOR') or hasRole('EMERGENCY_OPERATOR') or hasRole('DRIVER')")
    public ResponseEntity<AssistanceRequest> getRequestById(@PathVariable Long id) {
        return ResponseEntity.ok(assistanceRequestService.getRequestById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('DRIVER') or hasRole('LOGISTICS_OPERATOR') or hasRole('ADMIN')")
    public ResponseEntity<AssistanceRequest> createRequest(
            @Valid @RequestBody AssistanceRequestDto dto,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(assistanceRequestService.createRequest(dto, username));
    }

    @PutMapping("/{id}/acknowledge")
    @PreAuthorize("hasRole('LOGISTICS_OPERATOR') or hasRole('ADMIN') or hasRole('EMERGENCY_OPERATOR')")
    public ResponseEntity<AssistanceRequest> acknowledgeRequest(
            @PathVariable Long id,
            Authentication authentication) {
        String operator = authentication != null ? authentication.getName() : "LOGISTICS_OPERATOR";
        return ResponseEntity.ok(assistanceRequestService.acknowledgeRequest(id, operator));
    }

    @PutMapping("/{id}/dispatch")
    @PreAuthorize("hasRole('LOGISTICS_OPERATOR') or hasRole('ADMIN') or hasRole('EMERGENCY_OPERATOR')")
    public ResponseEntity<AssistanceRequest> dispatchAssistance(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        String action = body.get("dispatchedAction");
        if (action == null || action.isBlank()) {
            throw new IllegalArgumentException("Field 'dispatchedAction' is required");
        }
        String operator = authentication != null ? authentication.getName() : "LOGISTICS_OPERATOR";
        return ResponseEntity.ok(assistanceRequestService.dispatchAssistance(id, action, operator));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('DRIVER') or hasRole('LOGISTICS_OPERATOR') or hasRole('ADMIN')")
    public ResponseEntity<AssistanceRequest> cancelRequest(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        String reason = body.get("reason");
        String username = authentication != null ? authentication.getName() : "UNKNOWN";
        boolean isOperatorOrAdmin = authentication != null && (
                authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_LOGISTICS_OPERATOR") || a.getAuthority().equals("ROLE_ADMIN")));

        return ResponseEntity.ok(assistanceRequestService.cancelRequest(id, reason, username, isOperatorOrAdmin));
    }

    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasRole('LOGISTICS_OPERATOR') or hasRole('ADMIN') or hasRole('EMERGENCY_OPERATOR')")
    public ResponseEntity<AssistanceRequest> resolveRequest(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        String notes = body != null ? body.get("resolutionNotes") : null;
        String operator = authentication != null ? authentication.getName() : "LOGISTICS_OPERATOR";
        return ResponseEntity.ok(assistanceRequestService.resolveRequest(id, notes, operator));
    }
}
