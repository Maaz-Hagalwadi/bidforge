package com.bidforge.contract.websocket;

import com.bidforge.contract.auth.AuthServiceClient;
import com.bidforge.contract.auth.UserInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final AuthServiceClient authServiceClient;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            List<String> authHeaders = accessor.getNativeHeader("Authorization");
            if (authHeaders != null && !authHeaders.isEmpty()) {
                // Validate JWT by calling auth-service
                UserInfo userInfo = authServiceClient.validate(authHeaders.get(0));
                if (userInfo != null) {
                    var auth = new UsernamePasswordAuthenticationToken(
                            userInfo, null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + userInfo.role())));
                    accessor.setUser(auth);
                    log.debug("WebSocket authenticated: {}", userInfo.email());
                }
            }
        }
        return message;
    }
}
