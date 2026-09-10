package com.ner.logistics.config;

import com.ner.logistics.auth.JwtTokenProvider;
import com.ner.logistics.user.User;
import com.ner.logistics.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;
import java.util.Optional;

@Slf4j
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = allowedOrigins.split(",");
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(origins)
                .withSockJS();
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(origins);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor != null) {
                    if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                        String authHeader = accessor.getFirstNativeHeader("Authorization");
                        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                            authHeader = accessor.getFirstNativeHeader("token");
                        }
                        if (authHeader != null && authHeader.startsWith("Bearer ")) {
                            String token = authHeader.substring(7);
                            if (jwtTokenProvider.validateToken(token)) {
                                String email = jwtTokenProvider.getEmailFromToken(token);
                                Optional<User> userOpt = userRepository.findByEmail(email);
                                if (userOpt.isPresent()) {
                                    User user = userOpt.get();
                                    List<org.springframework.security.core.GrantedAuthority> authorities = new java.util.ArrayList<>();
                                    authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
                                    if (user.getRole().getPermissions() != null) {
                                        for (com.ner.logistics.user.Permission perm : user.getRole().getPermissions()) {
                                            authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority(perm.name()));
                                        }
                                    }
                                    UsernamePasswordAuthenticationToken auth =
                                            new UsernamePasswordAuthenticationToken(user, null, authorities);
                                    accessor.setUser(auth);
                                    log.info("🔌 Authenticated WebSocket connection for user: {} ({})", user.getEmail(), user.getRole());
                                }
                            }
                        }
                    } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                        String destination = accessor.getDestination();
                        if (destination != null) {
                            if (destination.startsWith("/topic/sos") || destination.startsWith("/topic/admin")) {
                                if (accessor.getUser() == null) {
                                    log.warn("⛔ Unauthenticated subscription attempt to emergency topic: {}", destination);
                                    throw new AccessDeniedException("Access Denied: Authentication required for emergency WebSocket topic: " + destination);
                                }
                            } else if (destination.startsWith("/topic/telemetry")) {
                                if (accessor.getUser() == null) {
                                    log.warn("⛔ Unauthenticated subscription attempt to telemetry topic: {}", destination);
                                    throw new AccessDeniedException("Access Denied: Authentication required for telemetry WebSocket topic: " + destination);
                                }
                            }
                        }
                    }
                }
                return message;
            }
        });
    }
}
