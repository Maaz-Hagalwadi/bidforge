package com.bidforge.auth.auth;

import com.bidforge.auth.auth.dto.request.GoogleLoginRequest;
import com.bidforge.auth.auth.dto.response.LoginResponse;
import com.bidforge.auth.common.exception.InvalidGoogleTokenException;
import com.bidforge.auth.common.exception.RoleRequiredException;
import com.bidforge.auth.login_activity.LoginActivityService;
import com.bidforge.auth.user.Role;
import com.bidforge.auth.user.User;
import com.bidforge.auth.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final RestTemplate restTemplate;
    private final LoginActivityService loginActivityService;

    private static final String USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

    public LoginResponse loginWithGoogle(GoogleLoginRequest request, HttpServletRequest httpRequest) {
        Map<String, String> claims = fetchGoogleUserInfo(request.getAccessToken());
        String googleId = claims.get("sub");
        String email = claims.get("email").toLowerCase().trim();
        String name = claims.getOrDefault("name", email);
        String picture = claims.get("picture");

        Optional<User> existing = userRepository.findByGoogleId(googleId);
        if (existing.isEmpty()) existing = userRepository.findByEmail(email);

        User user;
        if (existing.isPresent()) {
            user = existing.get();
            if (user.getGoogleId() == null) user.setGoogleId(googleId);
            if (user.getProfileImageUrl() == null && picture != null) user.setProfileImageUrl(picture);
            user.setEmailVerified(true);
            user = userRepository.save(user);
        } else {
            if (request.getRole() == null || request.getRole() == Role.ADMIN)
                throw new RoleRequiredException("Please select your role to continue.");
            user = userRepository.save(User.builder()
                    .name(name).email(email).googleId(googleId)
                    .role(request.getRole()).emailVerified(true).profileImageUrl(picture).build());
        }
        loginActivityService.record(user, httpRequest, "GOOGLE");
        return LoginResponse.builder()
                .message("Google login successful").accessToken(jwtService.generateToken(user))
                .refreshToken(refreshTokenService.createRefreshToken(user)).tokenType("Bearer").build();
    }

    @SuppressWarnings("unchecked")
    private Map<String, String> fetchGoogleUserInfo(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            ResponseEntity<Map> response = restTemplate.exchange(USERINFO_URL, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
            Map<String, String> claims = response.getBody();
            if (claims == null || claims.get("sub") == null) throw new InvalidGoogleTokenException("Invalid Google token.");
            return claims;
        } catch (InvalidGoogleTokenException e) {
            throw e;
        } catch (Exception e) {
            throw new InvalidGoogleTokenException("Could not verify Google token.");
        }
    }
}
