package com.bidforge.app.auth;

import com.bidforge.app.auth.dto.request.LoginRequest;
import com.bidforge.app.auth.dto.request.RegisterRequest;
import com.bidforge.app.auth.dto.response.LoginResponse;
import com.bidforge.app.common.exception.EmailAlreadyExistsException;
import com.bidforge.app.common.exception.InvalidCredentialsException;
import com.bidforge.app.common.exception.PhoneAlreadyExistsException;
import com.bidforge.app.common.exception.UserNotFoundException;
import com.bidforge.app.user.*;
import com.bidforge.app.user.dto.response.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @GetMapping("/test")
    public String test() {
        return "Protected API working";
    }

    @PostMapping("/register")
    public UserResponse register(@Valid @RequestBody RegisterRequest request) {

        Role role = request.getRole() != null ? request.getRole() : Role.CLIENT;

        userRepository.findByEmail(request.getEmail())
                .ifPresent(u -> {
                    throw new EmailAlreadyExistsException("Email already exists");
                });

        if (request.getPhoneNumber() != null) {
            userRepository.findByPhoneNumber(request.getPhoneNumber())
                    .ifPresent(u -> {
                        throw new PhoneAlreadyExistsException("Phone number already exists");
                    });
        }


        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .role(role)
                .build();

        User savedUser = userRepository.save(user);

        return UserResponse.builder()
                .id(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .phoneNumber(savedUser.getPhoneNumber())
                .role(savedUser.getRole())
                .rating(savedUser.getRating())
                .build();
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getEmail());

        return LoginResponse.builder()
                .message("Login successful")
                .token(token)
                .build();
    }
}