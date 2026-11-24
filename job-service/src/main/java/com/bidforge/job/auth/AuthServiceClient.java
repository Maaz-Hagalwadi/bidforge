package com.bidforge.job.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthServiceClient {

    private final RestTemplate restTemplate;

    @Value("${auth-service.url}")
    private String authServiceUrl;

    // Validate JWT by calling auth-service over HTTP — job-service never touches the secret key
    public UserInfo validate(String bearerToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", bearerToken);
            ResponseEntity<UserInfo> response = restTemplate.exchange(
                    authServiceUrl + "/auth/validate",
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    UserInfo.class
            );
            if (response.getStatusCode().is2xxSuccessful()) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.warn("Auth-service token validation failed: {}", e.getMessage());
        }
        return null;
    }

    // Look up a user by ID — used when inviting freelancers to verify they exist and have the right role
    public UserInfo getUserById(Long userId) {
        try {
            ResponseEntity<UserInfo> response = restTemplate.getForEntity(
                    authServiceUrl + "/users/" + userId,
                    UserInfo.class
            );
            if (response.getStatusCode().is2xxSuccessful()) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.warn("Auth-service user lookup failed for id={}: {}", userId, e.getMessage());
        }
        return null;
    }
}
