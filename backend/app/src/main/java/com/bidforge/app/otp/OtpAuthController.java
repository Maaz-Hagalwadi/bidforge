package com.bidforge.app.otp;

import com.bidforge.app.otp.dto.AuthResponse;
import com.bidforge.app.otp.dto.SendOtpRequest;
import com.bidforge.app.otp.dto.VerifyOtpRequest;
import com.bidforge.app.otp.OtpService;
import com.bidforge.app.auth.JwtService;
import com.bidforge.app.user.User;
import com.bidforge.app.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class OtpAuthController {

    private final OtpService otpService;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    @PostMapping("/send-otp")
    public String sendOtp(@RequestBody SendOtpRequest request) {

        otpService.sendOtp(request.getEmail());

        return "OTP sent successfully";
    }

    @PostMapping("/verify-otp")
    public AuthResponse verifyOtp(@RequestBody VerifyOtpRequest request) {

        otpService.verifyOtp(request);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();

        String token = jwtService.generateToken(user);

        return new AuthResponse(token);
    }
}
