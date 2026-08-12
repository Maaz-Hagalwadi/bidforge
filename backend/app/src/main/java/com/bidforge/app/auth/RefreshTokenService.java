package com.bidforge.app.auth;

import com.bidforge.app.auth.dto.RefreshTokenResult;
import com.bidforge.app.common.exception.InvalidTokenException;
import com.bidforge.app.user.User;
import com.bidforge.app.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final StringRedisTemplate redisTemplate;
    private final UserRepository userRepository;

    @Value("${refresh.token.expiry-days:7}")
    private long expiryDays;

    private static final String KEY_PREFIX = "refresh_token:";

    public String createRefreshToken(User user) {
        String token = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(KEY_PREFIX + token,
                String.valueOf(user.getId()), expiryDays, TimeUnit.DAYS);
        return token;
    }

    public RefreshTokenResult validateAndRotate(String tokenValue) {
        String userId = redisTemplate.opsForValue().get(KEY_PREFIX + tokenValue);
        if (userId == null) {
            throw new InvalidTokenException("Invalid or expired refresh token");
        }

        redisTemplate.delete(KEY_PREFIX + tokenValue);

        User user = userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new InvalidTokenException("User not found"));

        String newToken = createRefreshToken(user);
        return new RefreshTokenResult(newToken, user);
    }

    public void revokeByToken(String tokenValue) {
        redisTemplate.delete(KEY_PREFIX + tokenValue);
    }
}
