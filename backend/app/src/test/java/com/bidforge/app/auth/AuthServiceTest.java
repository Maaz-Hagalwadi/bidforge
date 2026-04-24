package com.bidforge.app.auth;

import com.bidforge.app.auth.dto.request.LoginRequest;
import com.bidforge.app.auth.dto.request.RegisterRequest;
import com.bidforge.app.auth.dto.response.LoginResponse;
import com.bidforge.app.common.exception.EmailAlreadyExistsException;
import com.bidforge.app.common.exception.InvalidCredentialsException;
import com.bidforge.app.common.exception.PhoneAlreadyExistsException;
import com.bidforge.app.user.Role;
import com.bidforge.app.user.User;
import com.bidforge.app.user.UserRepository;
import com.bidforge.app.user.dto.response.UserResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;

    @InjectMocks private AuthService authService;

    private RegisterRequest registerRequest;
    private User savedUser;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest(
                "John Doe", "john@example.com", "Password1@", null);

        savedUser = User.builder()
                .id(1L)
                .name("John Doe")
                .email("john@example.com")
                .password("encoded")
                .role(Role.CLIENT)
                .build();
    }

    @Test
    void register_success_returnsUserResponse() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("encoded");
        when(userRepository.save(any())).thenReturn(savedUser);

        UserResponse response = authService.register(registerRequest);

        assertThat(response.getEmail()).isEqualTo("john@example.com");
        assertThat(response.getRole()).isEqualTo(Role.CLIENT);
    }

    @Test
    void register_alwaysAssignsClientRole() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            assertThat(u.getRole()).isEqualTo(Role.CLIENT);
            return savedUser;
        });

        authService.register(registerRequest);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_throwsWhenEmailExists() {
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(savedUser));

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(EmailAlreadyExistsException.class);
    }

    @Test
    void register_throwsWhenPhoneExists() {
        RegisterRequest reqWithPhone = new RegisterRequest(
                "Jane", "jane@example.com", "Password1@", "+1234567890");
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(userRepository.findByPhoneNumber("+1234567890"))
                .thenReturn(Optional.of(savedUser));

        assertThatThrownBy(() -> authService.register(reqWithPhone))
                .isInstanceOf(PhoneAlreadyExistsException.class);
    }

    @Test
    void login_success_returnsToken() {
        LoginRequest loginRequest = new LoginRequest("john@example.com", "Password1@");
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(savedUser));
        when(passwordEncoder.matches("Password1@", "encoded")).thenReturn(true);
        when(jwtService.generateToken(savedUser)).thenReturn("jwt-token");

        LoginResponse response = authService.login(loginRequest);

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getMessage()).isEqualTo("Login successful");
    }

    @Test
    void login_throwsWhenUserNotFound() {
        LoginRequest loginRequest = new LoginRequest("nobody@example.com", "Password1@");
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    void login_throwsWhenPasswordWrong() {
        LoginRequest loginRequest = new LoginRequest("john@example.com", "WrongPass1@");
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(savedUser));
        when(passwordEncoder.matches("WrongPass1@", "encoded")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Invalid email or password");
    }
}
