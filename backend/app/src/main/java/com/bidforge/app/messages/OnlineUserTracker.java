package com.bidforge.app.messages;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OnlineUserTracker {

    private static final String KEY = "online_users";

    private final StringRedisTemplate redisTemplate;

    public void userOnline(String username) {
        redisTemplate.opsForSet().add(KEY, username);
    }

    public void userOffline(String username) {
        redisTemplate.opsForSet().remove(KEY, username);
    }

    public boolean isOnline(String username) {
        return Boolean.TRUE.equals(redisTemplate.opsForSet().isMember(KEY, username));
    }
}
