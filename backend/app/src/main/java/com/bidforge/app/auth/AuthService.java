package com.bidforge.app.auth;

import com.bidforge.app.auth.dto.request.LoginRequest;
import com.bidforge.app.auth.dto.request.RefreshTokenRequest;
import com.bidforge.app.auth.dto.request.RegisterRequest;
import com.bidforge.app.auth.dto.response.LoginResponse;
import com.bidforge.app.common.exception.EmailAlreadyExistsException;
import com.bidforge.app.common.exception.InvalidCredentialsException;
import com.bidforge.app.common.exception.PhoneAlreadyExistsException;
import com.bidforge.app.user.Role;
import com.bidforge.app.user.User;
import com.bidforge.app.user.UserRepository;
import com.bidforge.app.user.dto.response.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public UserResponse register(RegisterRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        userRepository.findByEmail(email)
                .ifPresent(u -> { throw new EmailAlreadyExistsException("Email already in use"); });

        if (request.getPhoneNumber() != null) {
            userRepository.findByPhoneNumber(request.getPhoneNumber())
                    .ifPresent(u -> { throw new PhoneAlreadyExistsException("Phone number already in use"); });
        }

        Role role = (request.getRole() != null && request.getRole() != Role.ADMIN)
                ? request.getRole() : Role.CLIENT;

        User user = User.builder()
                .name(request.getName())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .role(role)
                .build();

        User saved = userRepository.save(user);

        return UserResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .email(saved.getEmail())
                .phoneNumber(saved.getPhoneNumber())
                .role(saved.getRole())
                .rating(saved.getRating())
                .build();
    }

    public LoginResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return LoginResponse.builder()
                .message("Login successful")
                .accessToken(jwtService.generateToken(user))
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .build();
    }

    public LoginResponse refresh(RefreshTokenRequest request) {
        RefreshToken newRefreshToken = refreshTokenService.validateAndRotate(request.getRefreshToken());
        User user = newRefreshToken.getUser();

        return LoginResponse.builder()
                .message("Token refreshed")
                .accessToken(jwtService.generateToken(user))
                .refreshToken(newRefreshToken.getToken())
                .tokenType("Bearer")
                .build();
    }

    public void logout(RefreshTokenRequest request) {
        refreshTokenService.revokeByToken(request.getRefreshToken());
    }
}
