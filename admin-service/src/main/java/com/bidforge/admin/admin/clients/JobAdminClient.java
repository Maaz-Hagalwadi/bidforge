package com.bidforge.admin.admin.clients;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@RequiredArgsConstructor
public class JobAdminClient {

    private final RestTemplate restTemplate;

    @Value("${job-service.url}")
    private String jobUrl;

    public Object getJobs(String token, int page, int size) {
        String url = UriComponentsBuilder.fromHttpUrl(jobUrl + "/internal/admin/jobs")
                .queryParam("page", page)
                .queryParam("size", size)
                .toUriString();
        return exchange(url, HttpMethod.GET, null, token);
    }

    public Object getStats(String token) {
        return exchange(jobUrl + "/internal/admin/stats", HttpMethod.GET, null, token);
    }

    private Object exchange(String url, HttpMethod method, Object body, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);
        ResponseEntity<Object> response = restTemplate.exchange(
                url, method, new HttpEntity<>(body, headers), Object.class);
        return response.getBody();
    }
}
