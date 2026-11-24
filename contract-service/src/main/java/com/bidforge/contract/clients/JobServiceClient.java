package com.bidforge.contract.clients;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class JobServiceClient {

    private final RestTemplate restTemplate;

    @Value("${job-service.url}")
    private String jobServiceUrl;

    // Called when contract completes — tells job-service to mark the job COMPLETED
    // Key learning: cross-service state sync via HTTP instead of direct entity update
    public void markJobCompleted(UUID jobId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            restTemplate.exchange(
                    jobServiceUrl + "/internal/jobs/" + jobId + "/complete",
                    HttpMethod.POST,
                    new HttpEntity<>(headers),
                    Void.class
            );
        } catch (Exception e) {
            log.warn("Failed to mark job {} as completed: {}", jobId, e.getMessage());
        }
    }
}
