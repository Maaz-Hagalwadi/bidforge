package com.bidforge.auth.otp;

import com.bidforge.auth.common.exception.*;
import com.bidforge.auth.email.EmailService;
import com.bidforge.auth.otp.dto.VerifyOtpRequest;
import com.bidforge.auth.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final StringRedisTemplate redisTemplate;
    private final EmailService emailService;
    private final UserRepository userRepository;

    private static final String OTP_PREFIX = "otp:";
    private static final String RATE_PREFIX = "otp:ratelimit:";

    public void sendOtp(String email) {
        userRepository.findByEmail(email).orElseThrow(() -> new UserNotFoundException("User not found"));
        if (Boolean.TRUE.equals(redisTemplate.hasKey(RATE_PREFIX + email)))
            throw new OtpRateLimitException("Please wait before requesting another OTP");
        String otp = String.valueOf(ThreadLocalRandom.current().nextInt(100000, 999999));
        redisTemplate.opsForValue().set(OTP_PREFIX + email, otp, OtpConstants.OTP_EXPIRY_MINUTES, TimeUnit.MINUTES);
        redisTemplate.opsForValue().set(RATE_PREFIX + email, "1", OtpConstants.OTP_RATE_LIMIT_MINUTES, TimeUnit.MINUTES);
        emailService.sendOtpEmail(email, otp);
    }

    public boolean verifyOtp(VerifyOtpRequest request) {
        String stored = redisTemplate.opsForValue().get(OTP_PREFIX + request.getEmail());
        if (stored == null) throw new OtpNotFoundException("OTP not found or expired");
        if (!stored.equals(request.getOtp())) throw new InvalidOtpException("Invalid OTP");
        redisTemplate.delete(OTP_PREFIX + request.getEmail());
        return true;
    }
}
