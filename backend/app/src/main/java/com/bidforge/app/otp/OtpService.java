package com.bidforge.app.otp;

import com.bidforge.app.common.exception.*;
import com.bidforge.app.otp.dto.VerifyOtpRequest;
import com.bidforge.app.notification.EmailService;
import com.bidforge.app.user.User;
import com.bidforge.app.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final EmailOtpRepository otpRepository;
    private final EmailService emailService;
    private final UserRepository userRepository;

    public void sendOtp(String email) {

        // optional: check user exists
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        // rate limit
        otpRepository.findTopByEmailOrderByIdDesc(email)
                .ifPresent(lastOtp -> {
                    if (lastOtp.getCreatedAt()
                            .plusMinutes(OtpConstants.OTP_RATE_LIMIT_MINUTES)
                            .isAfter(LocalDateTime.now())) {

                        throw new OtpRateLimitException(
                                "Please wait before requesting another OTP"
                        );
                    }
                });

        String otp = String.valueOf(
                ThreadLocalRandom.current().nextInt(100000, 999999)
        );

        EmailOtp emailOtp = EmailOtp.builder()
                .email(email)
                .otp(otp)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(OtpConstants.OTP_EXPIRY_MINUTES))
                .used(false)
                .build();

        otpRepository.save(emailOtp);

        emailService.sendOtpEmail(email, otp);
    }

    public boolean verifyOtp(VerifyOtpRequest request) {

        EmailOtp otp = otpRepository
                .findTopByEmailOrderByIdDesc(request.getEmail())
                .orElseThrow(() ->
                        new OtpNotFoundException("OTP not found")
                );

        if (otp.isUsed()) {
            throw new OtpAlreadyUsedException("OTP already used");
        }

        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new OtpExpiredException("OTP expired");
        }

        if (!otp.getOtp().equals(request.getOtp())) {
            throw new InvalidOtpException("Invalid OTP");
        }

        otp.setUsed(true);

        otpRepository.save(otp);

        return true;
    }
}
