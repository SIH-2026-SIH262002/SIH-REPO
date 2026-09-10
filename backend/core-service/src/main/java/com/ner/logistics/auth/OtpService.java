package com.ner.logistics.auth;

import com.ner.logistics.user.Permission;
import com.ner.logistics.user.User;
import com.ner.logistics.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;

    // Concurrent in-memory store for OTPs (Key: phoneNumber, Value: OTP code)
    private final Map<String, String> otpCache = new ConcurrentHashMap<>();

    public String sendOtp(OtpSendRequestDto dto) {
        String phone = dto.getPhoneNumber().trim();
        // Demo/Static OTP 123456 or random 6-digit number
        String otp = "123456"; 

        otpCache.put(phone, otp);
        log.info("📲 OTP generated for mobile number {}: {}", phone, otp);

        return "OTP sent successfully to " + phone + ". (Demo OTP: 123456)";
    }

    @Transactional
    public AuthResponse verifyOtpAndLogin(OtpVerifyRequestDto dto) {
        String phone = dto.getPhoneNumber().trim();
        String enteredOtp = dto.getOtp().trim();

        String cachedOtp = otpCache.get(phone);
        if (cachedOtp == null || !cachedOtp.equals(enteredOtp)) {
            throw new IllegalArgumentException("Invalid or expired OTP code.");
        }

        // OTP verified successfully - clear from cache
        otpCache.remove(phone);

        // Find existing user by phone number or auto-register new Driver profile
        Optional<User> userOpt = userRepository.findByPhoneNumber(phone);
        User user;

        if (userOpt.isPresent()) {
            user = userOpt.get();
        } else {
            log.error("❌ OTP Verification Rejected: Phone number {} is not provisioned", phone);
            throw new org.springframework.security.access.AccessDeniedException(
                "Access Denied: Phone number " + phone + " is not registered. Contact system administrator for account provisioning."
            );
        }

        String jwtToken = tokenProvider.generateToken(user.getUsername(), user.getRole().name());

        List<String> perms = user.getRole().getPermissions().stream()
                .map(Permission::name)
                .collect(Collectors.toList());

        return AuthResponse.builder()
                .token(jwtToken)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .roles(List.of(user.getRole().name()))
                .permissions(perms)
                .fullName(user.getFullName())
                .build();
    }
}
