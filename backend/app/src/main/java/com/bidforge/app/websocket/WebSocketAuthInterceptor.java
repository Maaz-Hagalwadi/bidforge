package com.bidforge.app.websocket;

import com.bidforge.app.auth.JwtService;
import com.bidforge.app.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null) {
            if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                List<String> authHeaders = accessor.getNativeHeader("Authorization");
                if (authHeaders != null && !authHeaders.isEmpty()) {
                    String token = authHeaders.get(0).replace("Bearer ", "");
                    if (jwtService.isTokenValid(token)) {
                        String email = jwtService.extractEmail(token);
                        userRepository.findByEmail(email).ifPresent(user -> {
                            var authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());
                            UsernamePasswordAuthenticationToken auth =
                                    new UsernamePasswordAuthenticationToken(user, null, List.of(authority));
                            accessor.setUser(auth);
                            
                            // Mark user as online
                            userRepository.updateOnlineStatus(user.getId(), true, LocalDateTime.now());
                        });
                    }
                }
            } else if (StompCommand.DISCONNECT.equals(accessor.getCommand())) {
                // Mark user as offline when they disconnect
                if (accessor.getUser() instanceof UsernamePasswordAuthenticationToken auth) {
                    var user = (com.bidforge.app.user.User) auth.getPrincipal();
                    userRepository.updateOnlineStatus(user.getId(), false, LocalDateTime.now());
                }
            }
        }

        return message;
    }
}
