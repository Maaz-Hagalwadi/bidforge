package com.bidforge.job.clients;

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
public class ContractServiceClient {

    private final RestTemplate restTemplate;

    @Value("${contract-service.url}")
    private String contractServiceUrl;

    // Called after bid acceptance — triggers contract creation in contract-service
    // Completes the chain: job-service (acceptBid) → contract-service (createContract)
    public void createContract(UUID jobId, String jobTitle,
                                Long clientId, String clientEmail, String clientName,
                                Long freelancerId, String freelancerEmail, String freelancerName,
                                Double agreedAmount, Integer deliveryDays) {
        try {
            Map<String, Object> body = Map.of(
                    "jobId", jobId.toString(),
                    "jobTitle", jobTitle,
                    "clientId", clientId,
                    "clientEmail", clientEmail,
                    "clientName", clientName,
                    "freelancerId", freelancerId,
                    "freelancerEmail", freelancerEmail,
                    "freelancerName", freelancerName,
                    "agreedAmount", agreedAmount,
                    "deliveryDays", deliveryDays
            );
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            restTemplate.postForEntity(
                    contractServiceUrl + "/internal/contracts",
                    new HttpEntity<>(body, headers),
                    Void.class
            );
            log.info("Contract creation triggered for jobId={}", jobId);
        } catch (Exception e) {
            log.warn("Failed to create contract for jobId={}: {}", jobId, e.getMessage());
        }
    }
}
