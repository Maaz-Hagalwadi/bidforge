package com.bidforge.app.messages;

import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class OnlineUserTracker {

    private final Set<String> onlineUsers = ConcurrentHashMap.newKeySet();

    public void userOnline(String username) {
        onlineUsers.add(username);
    }

    public void userOffline(String username) {
        onlineUsers.remove(username);
    }

    public boolean isOnline(String username) {
        return onlineUsers.contains(username);
    }
}