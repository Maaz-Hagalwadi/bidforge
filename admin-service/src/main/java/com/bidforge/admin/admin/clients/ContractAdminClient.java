package com.bidforge.admin.admin.clients;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ContractAdminClient {

    private final RestTemplate restTemplate;

    @Value("${contract-service.url}")
    private String contractUrl;

    public Object getContracts(String token, int page, int size) {
        String url = UriComponentsBuilder.fromHttpUrl(contractUrl + "/internal/admin/contracts")
                .queryParam("page", page)
                .queryParam("size", size)
                .toUriString();
        return exchange(url, HttpMethod.GET, null, token);
    }

    public Object getDisputes(String token, int page, int size) {
        String url = UriComponentsBuilder.fromHttpUrl(contractUrl + "/internal/admin/disputes")
                .queryParam("page", page)
                .queryParam("size", size)
                .toUriString();
        return exchange(url, HttpMethod.GET, null, token);
    }

    public Object getPayments(String token) {
        return exchange(contractUrl + "/internal/admin/payments", HttpMethod.GET, null, token);
    }

    public Object markDisputeUnderReview(String token, UUID id) {
        return exchange(contractUrl + "/internal/admin/disputes/" + id + "/under-review", HttpMethod.PATCH, null, token);
    }

    public Object resolveDispute(String token, UUID id, Object body) {
        return exchange(contractUrl + "/internal/admin/disputes/" + id + "/resolve", HttpMethod.PATCH, body, token);
    }

    public Object getContractStats(String token) {
        return exchange(contractUrl + "/internal/admin/stats", HttpMethod.GET, null, token);
    }

    private Object exchange(String url, HttpMethod method, Object body, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);
        ResponseEntity<Object> response = restTemplate.exchange(
                url, method, new HttpEntity<>(body, headers), Object.class);
        return response.getBody();
    }
}
