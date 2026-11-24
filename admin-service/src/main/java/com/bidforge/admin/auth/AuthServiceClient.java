package com.bidforge.admin.auth;

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
            if (response.getStatusCode().is2xxSuccessful()) return response.getBody();
        } catch (Exception e) {
            log.warn("Auth-service validation failed: {}", e.getMessage());
        }
        return null;
    }
}
