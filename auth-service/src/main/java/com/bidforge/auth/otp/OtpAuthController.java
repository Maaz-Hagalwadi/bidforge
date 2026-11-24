package com.bidforge.auth.otp;

import com.bidforge.auth.auth.JwtService;
import com.bidforge.auth.login_activity.LoginActivityService;
import com.bidforge.auth.otp.dto.AuthResponse;
import com.bidforge.auth.otp.dto.SendOtpRequest;
import com.bidforge.auth.otp.dto.VerifyOtpRequest;
import com.bidforge.auth.user.User;
import com.bidforge.auth.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class OtpAuthController {

    private final OtpService otpService;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final LoginActivityService loginActivityService;

    @PostMapping("/send-otp")
    public String sendOtp(@RequestBody SendOtpRequest request) {
        otpService.sendOtp(request.getEmail());
        return "OTP sent successfully";
    }

    @PostMapping("/verify-otp")
    public AuthResponse verifyOtp(@RequestBody VerifyOtpRequest request, HttpServletRequest httpRequest) {
        otpService.verifyOtp(request);
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        loginActivityService.record(user, httpRequest, "OTP");
        return new AuthResponse(jwtService.generateToken(user));
    }
}
