package com.bidforge.app.websocket;

import com.bidforge.app.messages.OnlineUserTracker;
import com.bidforge.app.messages.dto.OnlineStatusEvent;
import com.bidforge.app.user.User;
import com.bidforge.app.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final OnlineUserTracker tracker;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    @EventListener
    public void handleConnect(SessionConnectEvent event) {
        Principal principal = event.getUser();
        if (principal instanceof UsernamePasswordAuthenticationToken auth &&
                auth.getPrincipal() instanceof User appUser) {
            tracker.userOnline(appUser.getEmail());
            messagingTemplate.convertAndSend(
                    "/topic/online",
                    new OnlineStatusEvent(appUser.getId(), appUser.getEmail(), true, null)
            );
        }
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        Principal principal = event.getUser();
        if (principal instanceof UsernamePasswordAuthenticationToken auth &&
                auth.getPrincipal() instanceof User appUser) {
            LocalDateTime now = LocalDateTime.now();
            tracker.userOffline(appUser.getEmail());
            userRepository.updateOnlineStatus(appUser.getId(), false, now);
            messagingTemplate.convertAndSend(
                    "/topic/online",
                    new OnlineStatusEvent(appUser.getId(), appUser.getEmail(), false, now)
            );
        }
    }

}
