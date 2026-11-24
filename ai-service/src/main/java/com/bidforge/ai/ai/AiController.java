package com.bidforge.ai.ai;

import com.bidforge.ai.auth.AuthServiceUserClient;
import com.bidforge.ai.auth.UserInfo;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;
    private final AuthServiceUserClient authServiceUserClient;

    private UserInfo getCurrentUser() {
        return (UserInfo) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private String bearerToken(HttpServletRequest request) {
        return request.getHeader("Authorization");
    }

    // ── 1. POST /ai/generate-description ────────────────────────────
    // Response: { description: string, skills: string[] }

    @PostMapping("/generate-description")
    public Map<String, Object> generateDescription(@RequestBody Map<String, String> req) {
        getCurrentUser();
        return aiService.generateDescription(
            req.get("title"),
            req.get("category"),
            req.get("notes")
        );
    }

    // ── 2. POST /ai/generate-proposal ───────────────────────────────
    // Response: { proposal: string }

    @PostMapping("/generate-proposal")
    public Map<String, Object> generateProposal(@RequestBody Map<String, String> req) {
        getCurrentUser();
        return aiService.generateProposal(
            req.get("jobTitle"),
            req.get("jobDescription"),
            req.get("requiredSkills")
        );
    }

    // ── 3. POST /ai/suggest-milestones ──────────────────────────────
    // Response: { milestones: [{ title, description, amount, dueDays }] }

    @PostMapping("/suggest-milestones")
    public Map<String, Object> suggestMilestones(@RequestBody Map<String, Object> req) {
        getCurrentUser();
        Double totalAmount = null;
        Integer deliveryDays = null;
        Object amountObj = req.get("totalAmount");
        if (amountObj != null) {
            try { totalAmount = Double.parseDouble(amountObj.toString()); } catch (NumberFormatException ignored) {}
        }
        Object daysObj = req.get("deliveryDays");
        if (daysObj != null) {
            try { deliveryDays = Integer.parseInt(daysObj.toString()); } catch (NumberFormatException ignored) {}
        }
        return aiService.suggestMilestones(
            (String) req.get("jobTitle"),
            (String) req.get("jobDescription"),
            totalAmount,
            deliveryDays
        );
    }

    // ── 4. GET /ai/job-recommendations ──────────────────────────────
    // Response: array of { jobId, title, matchScore, matchReason, category, requiredSkills }

    @GetMapping("/job-recommendations")
    public Object jobRecommendations(HttpServletRequest request) {
        UserInfo user = getCurrentUser();
        Map<String, Object> profile = authServiceUserClient.getUserById(user.id(), bearerToken(request));

        String skills = extractString(profile, "skills");
        // skills may be a list in UserResponse
        Object skillsRaw = profile.get("skills");
        if (skillsRaw instanceof List<?> skillList) {
            skills = skillList.stream().map(Object::toString).collect(Collectors.joining(", "));
        }

        String bio = extractString(profile, "bio");

        Map<String, Object> result = aiService.jobRecommendations(skills, bio);
        // jobRecommendations returns Map.of() when empty or Map.of("recommendations", list)
        // The frontend expects an array directly — return the list if present
        if (result.containsKey("recommendations")) {
            return result.get("recommendations");
        }
        return List.of();
    }

    // ── 5. POST /ai/optimize-profile ────────────────────────────────
    // Response: { bioRewrite, titleSuggestion, skillsToAdd, overallScore, feedback }

    @PostMapping("/optimize-profile")
    public Map<String, Object> optimizeProfile(HttpServletRequest request) {
        UserInfo user = getCurrentUser();
        Map<String, Object> profile = authServiceUserClient.getUserById(user.id(), bearerToken(request));

        String bio = extractString(profile, "bio");
        String title = extractString(profile, "title");
        Object hourlyRate = profile.get("hourlyRate");
        Object rating = profile.get("rating");

        String skills = "";
        Object skillsRaw = profile.get("skills");
        if (skillsRaw instanceof List<?> skillList) {
            skills = skillList.stream().map(Object::toString).collect(Collectors.joining(", "));
        } else if (skillsRaw != null) {
            skills = skillsRaw.toString();
        }

        return aiService.optimizeProfile(bio, skills, title, hourlyRate, rating);
    }

    // ── 6. POST /ai/bid-price ────────────────────────────────────────
    // Response: { lowBid, competitiveBid, premiumBid, reasoning }

    @PostMapping("/bid-price")
    public Map<String, Object> bidPrice(@RequestBody Map<String, String> req) {
        getCurrentUser();
        return aiService.suggestBidPrice(
            req.get("jobTitle"),
            req.get("jobDescription"),
            req.get("budgetMin"),
            req.get("budgetMax")
        );
    }

    // ── 7. POST /ai/interview-questions ─────────────────────────────
    // Response: { questions: string[] }

    @PostMapping("/interview-questions")
    public Map<String, Object> interviewQuestions(@RequestBody Map<String, String> req) {
        getCurrentUser();
        return aiService.generateInterviewQuestions(
            req.get("jobTitle"),
            req.get("jobDescription"),
            req.get("requiredSkills")
        );
    }

    // ── 8. POST /ai/extract-resume-skills (multipart) ───────────────
    // Response: { skills: string[] }

    @PostMapping(value = "/extract-resume-skills", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> extractResumeSkills(
            @RequestParam("file") MultipartFile file) throws IOException {
        getCurrentUser();
        byte[] bytes = file.getBytes();
        String text;
        // Attempt to read as UTF-8 text; if it looks like binary (null bytes), return empty
        text = new String(bytes, StandardCharsets.UTF_8);
        boolean likelyBinary = text.chars().filter(c -> c == 0).count() > 10;
        if (likelyBinary) {
            return Map.of("skills", List.of());
        }
        if (text.length() > 3000) {
            text = text.substring(0, 3000);
        }
        return aiService.extractResumeSkillsFromText(text);
    }

    // ── 9. POST /ai/chat ─────────────────────────────────────────────
    // Response: { reply: string }

    @PostMapping("/chat")
    public Map<String, Object> chat(@RequestBody Map<String, Object> req) {
        getCurrentUser();
        String message = (String) req.get("message");
        // history is [{role, content}] — serialize to string for context
        Object historyObj = req.get("history");
        String historyStr = "";
        if (historyObj != null) {
            historyStr = historyObj.toString();
        }
        return aiService.chatAssistant(message, historyStr);
    }

    // ── Helper ───────────────────────────────────────────────────────

    private String extractString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : "";
    }
}
