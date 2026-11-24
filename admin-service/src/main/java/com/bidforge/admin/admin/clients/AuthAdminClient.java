package com.bidforge.admin.admin.clients;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@RequiredArgsConstructor
public class AuthAdminClient {

    private final RestTemplate restTemplate;

    @Value("${auth-service.url}")
    private String authUrl;

    public Object getUsers(String token, int page, int size, String q) {
        String url = UriComponentsBuilder.fromHttpUrl(authUrl + "/internal/admin/users")
                .queryParam("page", page)
                .queryParam("size", size)
                .queryParam("q", q)
                .toUriString();
        return exchange(url, HttpMethod.GET, null, token);
    }

    public Object banUser(String token, Long id) {
        return exchange(authUrl + "/internal/admin/users/" + id + "/ban", HttpMethod.PATCH, null, token);
    }

    public Object unbanUser(String token, Long id) {
        return exchange(authUrl + "/internal/admin/users/" + id + "/unban", HttpMethod.PATCH, null, token);
    }

    public Object deleteUser(String token, Long id) {
        return exchange(authUrl + "/internal/admin/users/" + id, HttpMethod.DELETE, null, token);
    }

    public Object getStats(String token) {
        return exchange(authUrl + "/internal/admin/stats", HttpMethod.GET, null, token);
    }

    public Object getLoginActivity(String token, int page, int size) {
        String url = UriComponentsBuilder.fromHttpUrl(authUrl + "/internal/admin/login-activity")
                .queryParam("page", page)
                .queryParam("size", size)
                .toUriString();
        return exchange(url, HttpMethod.GET, null, token);
    }

    private Object exchange(String url, HttpMethod method, Object body, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);
        ResponseEntity<Object> response = restTemplate.exchange(
                url, method, new HttpEntity<>(body, headers), Object.class);
        return response.getBody();
    }
}
