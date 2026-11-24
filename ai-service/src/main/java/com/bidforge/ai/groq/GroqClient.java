package com.bidforge.ai.groq;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class GroqClient {

    @Value("${groq.api-key:}")
    private String apiKey;

    @Value("${groq.api-url}")
    private String apiUrl;

    @Value("${groq.model}")
    private String model;

    private final RestTemplate restTemplate;

    public GroqClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String chat(String systemPrompt, String userMessage) {
        if (apiKey == null || apiKey.isBlank()) {
            return "AI features require GROQ_API_KEY to be configured.";
        }

        Map<String, Object> body = Map.of(
            "model", model,
            "messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userMessage)
            ),
            "max_tokens", 1024
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                apiUrl,
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return extractContent(response.getBody());
            }
        } catch (Exception e) {
            log.error("Groq API call failed: {}", e.getMessage());
        }

        return "AI service temporarily unavailable.";
    }

    @SuppressWarnings("unchecked")
    private String extractContent(Map<?, ?> body) {
        try {
            List<?> choices = (List<?>) body.get("choices");
            if (choices == null || choices.isEmpty()) return "AI service temporarily unavailable.";
            Map<?, ?> message = (Map<?, ?>) ((Map<?, ?>) choices.get(0)).get("message");
            if (message == null) return "AI service temporarily unavailable.";
            Object content = message.get("content");
            return content != null ? content.toString() : "AI service temporarily unavailable.";
        } catch (Exception e) {
            log.error("Failed to parse Groq response: {}", e.getMessage());
            return "AI service temporarily unavailable.";
        }
    }
}
