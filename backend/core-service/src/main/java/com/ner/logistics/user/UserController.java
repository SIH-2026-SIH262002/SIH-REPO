package com.ner.logistics.user;

import com.ner.logistics.audit.AuditService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasAuthority('USER_VIEW') or hasAuthority('USER_MANAGE')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('USER_CREATE') or hasAuthority('USER_MANAGE')")
    public ResponseEntity<?> createUser(@RequestBody UserProvisionDto dto, @AuthenticationPrincipal User actor) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("error", "User with this email already exists."));
        }
        if (userRepository.existsByUsername(dto.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username is already taken."));
        }

        UserRole role = UserRole.fromString(dto.getRole());

        User user = User.builder()
                .username(dto.getUsername())
                .email(dto.getEmail())
                .fullName(dto.getFullName())
                .phoneNumber(dto.getPhoneNumber())
                .district(dto.getDistrict())
                .role(role)
                .status(UserAccountStatus.ACTIVE)
                .build();

        User saved = userRepository.save(user);

        auditService.logDetailedEvent(
                actor != null ? actor.getUsername() : "ADMIN",
                actor != null ? actor.getRole().name() : "ADMIN",
                "USER_PROVISIONED",
                "User",
                saved.getId().toString(),
                "NONE",
                saved.getRole().name(),
                "Admin provisioned new operational account: " + saved.getEmail() + " in district " + saved.getDistrict(),
                null,
                "SUCCESS"
        );

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasAuthority('ROLE_MANAGE')")
    public ResponseEntity<?> updateUserRole(@PathVariable Long id,
                                            @RequestBody UserRoleChangeDto dto,
                                            @AuthenticationPrincipal User actor) {
        if (dto.getJustificationReason() == null || dto.getJustificationReason().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mandatory justification reason is required for role modification."));
        }

        return userRepository.findById(id).map(user -> {
            String oldRole = user.getRole().name();
            user.setRole(dto.getNewRole());
            userRepository.save(user);

            auditService.logDetailedEvent(
                    actor != null ? actor.getUsername() : "ADMIN",
                    actor != null ? actor.getRole().name() : "ADMIN",
                    "USER_ROLE_CHANGED",
                    "User",
                    user.getId().toString(),
                    oldRole,
                    dto.getNewRole().name(),
                    dto.getJustificationReason(),
                    null,
                    "SUCCESS"
            );

            return ResponseEntity.ok(user);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/suspend")
    @PreAuthorize("hasAuthority('USER_SUSPEND') or hasAuthority('USER_MANAGE')")
    public ResponseEntity<?> suspendUser(@PathVariable Long id,
                                         @RequestBody UserStatusChangeDto dto,
                                         @AuthenticationPrincipal User actor) {
        if (actor != null && actor.getId() != null && actor.getId().equals(id)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Admin Self-Protection Active: You cannot suspend or deactivate your own account."));
        }
        if (dto.getJustificationReason() == null || dto.getJustificationReason().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mandatory justification reason is required for account suspension."));
        }

        return userRepository.findById(id).map(user -> {
            String oldStatus = user.getStatus().name();
            user.setStatus(UserAccountStatus.SUSPENDED);
            userRepository.save(user);

            auditService.logDetailedEvent(
                    actor != null ? actor.getUsername() : "ADMIN",
                    actor != null ? actor.getRole().name() : "ADMIN",
                    "USER_SUSPENDED",
                    "User",
                    user.getId().toString(),
                    oldStatus,
                    UserAccountStatus.SUSPENDED.name(),
                    dto.getJustificationReason(),
                    null,
                    "SUCCESS"
            );

            return ResponseEntity.ok(user);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/reactivate")
    @PreAuthorize("hasAuthority('USER_REACTIVATE') or hasAuthority('USER_MANAGE')")
    public ResponseEntity<?> reactivateUser(@PathVariable Long id,
                                            @RequestBody UserStatusChangeDto dto,
                                            @AuthenticationPrincipal User actor) {
        if (dto.getJustificationReason() == null || dto.getJustificationReason().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mandatory justification reason is required for account reactivation."));
        }

        return userRepository.findById(id).map(user -> {
            String oldStatus = user.getStatus().name();
            user.setStatus(UserAccountStatus.ACTIVE);
            userRepository.save(user);

            auditService.logDetailedEvent(
                    actor != null ? actor.getUsername() : "ADMIN",
                    actor != null ? actor.getRole().name() : "ADMIN",
                    "USER_REACTIVATED",
                    "User",
                    user.getId().toString(),
                    oldStatus,
                    UserAccountStatus.ACTIVE.name(),
                    dto.getJustificationReason(),
                    null,
                    "SUCCESS"
            );

            return ResponseEntity.ok(user);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('USER_DEACTIVATE') or hasAuthority('USER_MANAGE')")
    public ResponseEntity<?> deactivateUser(@PathVariable Long id,
                                            @RequestBody UserStatusChangeDto dto,
                                            @AuthenticationPrincipal User actor) {
        if (dto.getJustificationReason() == null || dto.getJustificationReason().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mandatory justification reason is required for account deactivation."));
        }

        return userRepository.findById(id).map(user -> {
            String oldStatus = user.getStatus().name();
            user.setStatus(UserAccountStatus.DEACTIVATED);
            userRepository.save(user);

            auditService.logDetailedEvent(
                    actor != null ? actor.getUsername() : "ADMIN",
                    actor != null ? actor.getRole().name() : "ADMIN",
                    "USER_DEACTIVATED",
                    "User",
                    user.getId().toString(),
                    oldStatus,
                    UserAccountStatus.DEACTIVATED.name(),
                    dto.getJustificationReason(),
                    null,
                    "SUCCESS"
            );

            return ResponseEntity.ok(user);
        }).orElse(ResponseEntity.notFound().build());
    }

    @Data
    public static class UserProvisionDto {
        private String username;
        private String email;
        private String fullName;
        private String phoneNumber;
        private String district;
        private String role;
    }

    @Data
    public static class UserStatusChangeDto {
        private String justificationReason;
    }

    @Data
    public static class UserRoleChangeDto {
        private UserRole newRole;
        private String justificationReason;
    }
}
