package com.ner.logistics.auth;

import com.ner.logistics.user.Permission;
import com.ner.logistics.user.User;
import com.ner.logistics.user.UserRepository;
import com.ner.logistics.user.UserRole;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final OtpService otpService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .or(() -> userRepository.findByUsername(loginRequest.getEmail()))
                .orElse(null);

        if (user == null || !passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body("Invalid email or password");
        }

        String token = tokenProvider.generateToken(user.getEmail(), user.getRole().name());

        List<String> perms = user.getRole().getPermissions().stream()
                .map(Permission::name)
                .collect(Collectors.toList());

        AuthResponse response = AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .roles(List.of(user.getRole().name()))
                .permissions(perms)
                .fullName(user.getFullName())
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/otp/send")
    public ResponseEntity<Map<String, String>> sendOtp(@Valid @RequestBody OtpSendRequestDto request) {
        String msg = otpService.sendOtp(request);
        return ResponseEntity.ok(Map.of("message", msg, "status", "SUCCESS"));
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<AuthResponse> verifyOtp(@Valid @RequestBody OtpVerifyRequestDto request) {
        return ResponseEntity.ok(otpService.verifyOtpAndLogin(request));
    }

    @PostMapping("/register")
    @PreAuthorize("hasAuthority('USER_MANAGE') or hasAuthority('USER_CREATE') or hasRole('ADMIN')")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            return ResponseEntity.badRequest().body("Error: Email is already registered");
        }
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            return ResponseEntity.badRequest().body("Error: Username is already taken");
        }

        UserRole role = UserRole.FIELD_OFFICER;
        if (registerRequest.getRole() != null) {
            try {
                role = UserRole.valueOf(registerRequest.getRole().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        User user = User.builder()
                .username(registerRequest.getUsername())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .role(role)
                .fullName(registerRequest.getFullName())
                .phoneNumber(registerRequest.getPhoneNumber())
                .build();

        userRepository.save(user);

        String token = tokenProvider.generateToken(user.getEmail(), user.getRole().name());

        List<String> perms = user.getRole().getPermissions().stream()
                .map(Permission::name)
                .collect(Collectors.toList());

        AuthResponse response = AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .roles(List.of(user.getRole().name()))
                .permissions(perms)
                .fullName(user.getFullName())
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        User user = (User) authentication.getPrincipal();
        List<String> perms = user.getRole().getPermissions().stream()
                .map(Permission::name)
                .collect(Collectors.toList());

        Map<String, Object> meData = Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "fullName", user.getFullName() != null ? user.getFullName() : "",
                "role", user.getRole().name(),
                "roles", List.of(user.getRole().name()),
                "permissions", perms
        );

        return ResponseEntity.ok(meData);
    }
}
