package com.bidforge.app.otp;

import com.bidforge.app.login_activity.LoginActivityService;
import com.bidforge.app.otp.dto.AuthResponse;
import com.bidforge.app.otp.dto.SendOtpRequest;
import com.bidforge.app.otp.dto.VerifyOtpRequest;
import com.bidforge.app.otp.OtpService;
import com.bidforge.app.auth.JwtService;
import com.bidforge.app.user.User;
import com.bidforge.app.user.UserRepository;
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

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();

        loginActivityService.record(user, httpRequest, "OTP");
        String token = jwtService.generateToken(user);

        return new AuthResponse(token);
    }
}
