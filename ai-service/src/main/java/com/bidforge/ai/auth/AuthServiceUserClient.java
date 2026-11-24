package com.bidforge.ai.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthServiceUserClient {

    private final RestTemplate restTemplate;

    @Value("${auth-service.url}")
    private String authUrl;

    @SuppressWarnings("unchecked")
    public Map<String, Object> getUserById(Long userId, String bearerToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", bearerToken);
            ResponseEntity<Map> response = restTemplate.exchange(
                authUrl + "/users/" + userId,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class
            );
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.warn("Failed to fetch user profile from auth-service for userId {}: {}", userId, e.getMessage());
        }
        return Map.of();
    }
}
