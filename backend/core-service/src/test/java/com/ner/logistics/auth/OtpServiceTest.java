package com.ner.logistics.auth;

import com.ner.logistics.user.User;
import com.ner.logistics.user.UserRepository;
import com.ner.logistics.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class OtpServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private PasswordEncoder passwordEncoder;

    private OtpService otpService;

    @BeforeEach
    void setUp() {
        otpService = new OtpService(userRepository, tokenProvider);
    }

    @Test
    void testSendAndVerifyOtpSuccess() {
        String phone = "+919876543213";
        OtpSendRequestDto sendDto = new OtpSendRequestDto(phone);
        String sendMsg = otpService.sendOtp(sendDto);

        assertTrue(sendMsg.contains("OTP sent successfully"));

        User mockDriver = User.builder()
                .id(1L)
                .username("driver_919876543213")
                .email("driver_919876543213@sih.gov.in")
                .role(UserRole.DRIVER)
                .fullName("Convoy Driver")
                .phoneNumber(phone)
                .build();

        when(userRepository.findByPhoneNumber(phone)).thenReturn(Optional.of(mockDriver));
        when(tokenProvider.generateToken(mockDriver.getUsername(), "DRIVER")).thenReturn("mock-jwt-token");

        OtpVerifyRequestDto verifyDto = new OtpVerifyRequestDto(phone, "123456");
        AuthResponse response = otpService.verifyOtpAndLogin(verifyDto);

        assertNotNull(response);
        assertEquals("mock-jwt-token", response.getToken());
        assertEquals("driver_919876543213", response.getUsername());
        assertEquals("DRIVER", response.getRole());
    }

    @Test
    void testVerifyOtpInvalidCode() {
        String phone = "+919876543213";
        otpService.sendOtp(new OtpSendRequestDto(phone));

        OtpVerifyRequestDto verifyDto = new OtpVerifyRequestDto(phone, "999999");
        assertThrows(IllegalArgumentException.class, () -> otpService.verifyOtpAndLogin(verifyDto));
    }
}
