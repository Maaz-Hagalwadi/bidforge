package com.bidforge.app.ai;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.bidforge.app.ai.dto.ChatRequest;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    @Value("${groq.api-key:}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String BASE_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL = "llama-3.1-8b-instant";

    public GeminiService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(15_000);
        factory.setReadTimeout(30_000);
        this.restTemplate = new RestTemplate(factory);
    }

    public String generate(String prompt, int maxTokens) {
        Map<String, Object> body = Map.of(
            "model", MODEL,
            "messages", List.of(Map.of("role", "user", "content", prompt)),
            "max_tokens", maxTokens,
            "temperature", 0.7
        );
        return callApi(body);
    }

    public String chat(String systemPrompt, List<ChatRequest.ChatMessage> history, String userMessage) {
        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        if (history != null) {
            for (ChatRequest.ChatMessage msg : history) {
                String role = "model".equals(msg.getRole()) ? "assistant" : "user";
                messages.add(Map.of("role", role, "content", msg.getContent()));
            }
        }
        messages.add(Map.of("role", "user", "content", userMessage));

        Map<String, Object> body = Map.of(
            "model", MODEL,
            "messages", messages,
            "max_tokens", 600,
            "temperature", 0.8
        );
        return callApi(body);
    }

    private String callApi(Map<String, Object> body) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new RuntimeException("Groq API key is not configured. Set GROQ_API_KEY environment variable.");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(BASE_URL, entity, String.class);
            return extractText(response.getBody());
        } catch (HttpClientErrorException e) {
            log.error("Groq API client error {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Groq API error: " + e.getStatusCode() + " — " + parseError(e.getResponseBodyAsString()));
        } catch (RestClientException e) {
            log.error("Groq API connection error: {}", e.getMessage());
            throw new RuntimeException("Failed to reach Groq API: " + e.getMessage());
        }
    }

    public <T> T generateJson(String prompt, int maxTokens, Class<T> type) {
        return parseJson(generate(prompt, maxTokens), type);
    }

    public <T> T generateJson(String prompt, int maxTokens, TypeReference<T> typeRef) {
        return parseJson(generate(prompt, maxTokens), typeRef);
    }

    private String extractText(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode choices = root.path("choices");
            if (choices.isEmpty()) {
                log.warn("Groq returned empty choices. Full response: {}", responseBody);
                throw new RuntimeException("Groq returned no content.");
            }
            return choices.get(0).path("message").path("content").asText();
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to parse Groq response: {}", responseBody);
            throw new RuntimeException("Failed to parse Groq response: " + e.getMessage());
        }
    }

    private String parseError(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            return root.path("error").path("message").asText(body);
        } catch (Exception e) {
            return body;
        }
    }

    private <T> T parseJson(String raw, Class<T> type) {
        String cleaned = stripFences(raw);
        try {
            return objectMapper.readValue(cleaned, type);
        } catch (Exception e) {
            String extracted = extractJson(cleaned);
            try {
                return objectMapper.readValue(extracted, type);
            } catch (Exception ex) {
                log.error("Failed to parse JSON: {}", cleaned);
                throw new RuntimeException("Failed to parse AI JSON response: " + ex.getMessage());
            }
        }
    }

    private <T> T parseJson(String raw, TypeReference<T> typeRef) {
        String cleaned = stripFences(raw);
        try {
            return objectMapper.readValue(cleaned, typeRef);
        } catch (Exception e) {
            String extracted = extractJson(cleaned);
            try {
                return objectMapper.readValue(extracted, typeRef);
            } catch (Exception ex) {
                log.error("Failed to parse JSON list: {}", cleaned);
                throw new RuntimeException("Failed to parse AI JSON list response: " + ex.getMessage());
            }
        }
    }

    private String stripFences(String raw) {
        return raw.replaceAll("(?s)```json\\s*", "").replaceAll("```", "").trim();
    }

    private String extractJson(String s) {
        int start = s.indexOf('[');
        int startObj = s.indexOf('{');
        if (start == -1 || (startObj != -1 && startObj < start)) start = startObj;
        int end = s.lastIndexOf(']');
        int endObj = s.lastIndexOf('}');
        if (end == -1 || (endObj != -1 && endObj > end)) end = endObj;
        if (start != -1 && end != -1 && end > start) return s.substring(start, end + 1);
        return s;
    }
}
