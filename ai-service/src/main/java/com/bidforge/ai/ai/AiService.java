package com.bidforge.ai.ai;

import com.bidforge.ai.groq.GroqClient;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final GroqClient groqClient;
    private final ObjectMapper objectMapper;

    // ── 1. Job Description Generator ────────────────────────────────

    public Map<String, Object> generateDescription(String title, String category, String notes) {
        String systemPrompt = "You are a professional job posting writer for a freelance marketplace.";
        String userMessage = String.format(
            "Job Title: %s\nCategory: %s\nClient notes: %s\n\n" +
            "Write a professional job description with 3 short paragraphs (~180 words total) covering:\n" +
            "1. Project overview\n2. Key responsibilities and deliverables\n3. What makes an ideal candidate\n\n" +
            "After the description, on a NEW line write exactly:\nSKILLS: skill1, skill2, skill3, skill4, skill5\n\n" +
            "List 5-8 relevant skills. Keep everything concise and professional.",
            safe(title), safe(category), safe(notes)
        );
        String raw = groqClient.chat(systemPrompt, userMessage);
        String description = raw;
        List<String> skills = new ArrayList<>();
        int idx = raw.lastIndexOf("SKILLS:");
        if (idx != -1) {
            description = raw.substring(0, idx).trim();
            skills = Arrays.stream(raw.substring(idx + 7).trim().split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());
        }
        Map<String, Object> result = new HashMap<>();
        result.put("description", description);
        result.put("skills", skills);
        return result;
    }

    // ── 2. Proposal Writer ───────────────────────────────────────────

    public Map<String, Object> generateProposal(String jobTitle, String jobDescription, String requiredSkills) {
        String systemPrompt = "You are an expert freelancer writing a winning bid proposal.";
        String userMessage = String.format(
            "Required skills: %s\n\n" +
            "Job:\nTitle: %s\nDescription: %s\n\n" +
            "Write a compelling, personalized bid proposal in EXACTLY under 950 characters.\n" +
            "Be specific, mention matching skills, and propose a clear approach.\n" +
            "Write in first person. No fluff. No greetings like \"Dear client\".\n" +
            "Output ONLY the proposal text, nothing else.",
            safe(requiredSkills), safe(jobTitle), truncate(jobDescription, 400)
        );
        String raw = groqClient.chat(systemPrompt, userMessage);
        Map<String, Object> result = new HashMap<>();
        result.put("proposal", raw);
        return result;
    }

    // ── 3. Milestone Planner ─────────────────────────────────────────

    public Map<String, Object> suggestMilestones(String jobTitle, String jobDescription, Double totalAmount, Integer deliveryDays) {
        String systemPrompt = "You are a project manager suggesting milestones for freelance projects.";
        String budgetStr = totalAmount != null ? String.format("$%.2f", totalAmount) : "not specified";
        String daysStr = deliveryDays != null ? deliveryDays + " days" : "not specified";
        String userMessage = String.format(
            "Project: %s\nDescription: %s\nTotal budget: %s\nTotal delivery time: %s\n\n" +
            "Return ONLY a valid JSON array (no markdown, no explanation):\n" +
            "[{\"title\":\"...\",\"description\":\"...\",\"amount\":0.00,\"dueDays\":0},...]\n\n" +
            "Rules:\n- Suggest 3-5 milestones\n- amounts must sum to the total budget\n" +
            "- dueDays is days from contract start\n" +
            "- Keep titles short (under 50 chars), descriptions clear (under 100 chars)",
            safe(jobTitle), truncate(jobDescription, 300), budgetStr, daysStr
        );
        String raw = groqClient.chat(systemPrompt, userMessage);
        List<Map<String, Object>> milestones = new ArrayList<>();
        try {
            String cleaned = stripMarkdownFences(raw);
            milestones = objectMapper.readValue(cleaned, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("Failed to parse milestones JSON: {}", e.getMessage());
        }
        Map<String, Object> result = new HashMap<>();
        result.put("milestones", milestones);
        return result;
    }

    // ── 4. Job Recommendations ───────────────────────────────────────

    public Map<String, Object> jobRecommendations(String freelancerSkills, String bio) {
        String systemPrompt = "You are a job-matching AI for a freelance marketplace.";
        String userMessage = String.format(
            "Freelancer profile:\nSkills: %s\nBio: %s\n\n" +
            "Return ONLY a valid JSON array (no markdown):\n" +
            "[{\"jobId\":\"\",\"title\":\"Suggested job type\",\"matchScore\":80," +
            "\"matchReason\":\"one sentence\",\"category\":\"...\",\"requiredSkills\":\"...\"}]\n\n" +
            "Suggest 5 job types/categories this freelancer should apply for.",
            safe(freelancerSkills), truncate(bio, 200)
        );
        String raw = groqClient.chat(systemPrompt, userMessage);
        List<Map<String, Object>> recommendations = new ArrayList<>();
        try {
            String cleaned = stripMarkdownFences(raw);
            recommendations = objectMapper.readValue(cleaned, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("Failed to parse job recommendations JSON: {}", e.getMessage());
        }
        return recommendations.isEmpty() ? Map.of() : Map.of("recommendations", recommendations);
    }

    // ── 5. Profile Optimizer ─────────────────────────────────────────

    public Map<String, Object> optimizeProfile(String currentBio, String skills, String title,
                                               Object hourlyRate, Object rating) {
        String systemPrompt = "You are a career coach for a freelance marketplace.";
        String userMessage = String.format(
            "Analyze this freelancer profile and suggest improvements.\n\n" +
            "Current profile:\nTitle: %s\nBio: %s\nSkills: %s\nHourly rate: %s\nRating: %s\n\n" +
            "Respond with ONLY a valid JSON object (no markdown):\n" +
            "{\"bioRewrite\":\"improved bio\",\"titleSuggestion\":\"improved title\"," +
            "\"skillsToAdd\":[\"skill1\",\"skill2\"],\"overallScore\":75," +
            "\"feedback\":\"one sentence\"}",
            safe(title), safe(currentBio), safe(skills),
            hourlyRate != null ? hourlyRate.toString() : "not specified",
            rating != null ? rating.toString() : "not specified"
        );
        String raw = groqClient.chat(systemPrompt, userMessage);
        try {
            String cleaned = stripMarkdownFences(raw);
            Map<String, Object> parsed = objectMapper.readValue(cleaned, new TypeReference<>() {});
            return parsed;
        } catch (Exception e) {
            log.warn("Failed to parse optimizeProfile JSON: {}", e.getMessage());
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("bioRewrite", "");
            fallback.put("titleSuggestion", "");
            fallback.put("skillsToAdd", List.of());
            fallback.put("overallScore", 0);
            fallback.put("feedback", raw);
            return fallback;
        }
    }

    // ── 6. Bid Price Recommendation ──────────────────────────────────

    public Map<String, Object> suggestBidPrice(String jobTitle, String jobDescription,
                                               String budgetMin, String budgetMax) {
        String systemPrompt = "You are a freelance bidding advisor.";
        String budgetHint = "";
        if (budgetMin != null && !budgetMin.isBlank() && budgetMax != null && !budgetMax.isBlank()) {
            budgetHint = "The client's budget range is: $" + budgetMin + " - $" + budgetMax + ".\n\n";
        } else if (budgetMin != null && !budgetMin.isBlank()) {
            budgetHint = "The client's budget is at least: $" + budgetMin + ".\n\n";
        }
        String userMessage = String.format(
            "%sJob: %s\nDescription: %s\n\n" +
            "Suggest three bid amounts in USD that a freelancer could offer:\n" +
            "- lowBid: a competitive low price to increase win chances\n" +
            "- competitiveBid: a fair market-rate price\n" +
            "- premiumBid: a premium price reflecting high quality\n\n" +
            "Return ONLY valid JSON (no markdown):\n" +
            "{\"lowBid\":0,\"competitiveBid\":0,\"premiumBid\":0,\"reasoning\":\"one sentence\"}\n\n" +
            "All amounts must be positive integers. reasoning must be under 100 chars.",
            budgetHint, safe(jobTitle), truncate(jobDescription, 300)
        );
        String raw = groqClient.chat(systemPrompt, userMessage);
        try {
            String cleaned = stripMarkdownFences(raw);
            Map<String, Object> parsed = objectMapper.readValue(cleaned, new TypeReference<>() {});
            return parsed;
        } catch (Exception e) {
            log.warn("Failed to parse bid price JSON: {}", e.getMessage());
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("lowBid", 0);
            fallback.put("competitiveBid", 0);
            fallback.put("premiumBid", 0);
            fallback.put("reasoning", raw);
            return fallback;
        }
    }

    // ── 7. Interview Questions Generator ────────────────────────────

    public Map<String, Object> generateInterviewQuestions(String jobTitle, String jobDescription,
                                                          String requiredSkills) {
        String systemPrompt = "You are a technical interviewer for a freelance marketplace.";
        String userMessage = String.format(
            "Generate 6 concise interview questions to evaluate a freelancer for this job.\n\n" +
            "Job: %s\nDescription: %s\nRequired skills: %s\n\n" +
            "Return ONLY a valid JSON array of strings (no markdown, no explanation):\n" +
            "[\"question 1\",\"question 2\",...]",
            safe(jobTitle), truncate(jobDescription, 300), safe(requiredSkills)
        );
        String raw = groqClient.chat(systemPrompt, userMessage);
        List<String> questions = new ArrayList<>();
        try {
            String cleaned = stripMarkdownFences(raw);
            questions = objectMapper.readValue(cleaned, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("Failed to parse interview questions JSON: {}", e.getMessage());
        }
        Map<String, Object> result = new HashMap<>();
        result.put("questions", questions);
        return result;
    }

    // ── 8. Resume Skill Extraction ───────────────────────────────────

    public Map<String, Object> extractResumeSkillsFromText(String resumeText) {
        String systemPrompt = "You are a skill extraction assistant for a freelance marketplace.";
        String text = resumeText != null && resumeText.length() > 3000
            ? resumeText.substring(0, 3000)
            : safe(resumeText);
        String userMessage = String.format(
            "Extract all technical skills, programming languages, frameworks, tools, and technologies " +
            "from this resume text.\n\n" +
            "Return ONLY a valid JSON array (no markdown, no explanation). Max 20 items:\n" +
            "[\"React\",\"Java\",...]\n\n" +
            "Resume text:\n%s",
            text
        );
        String raw = groqClient.chat(systemPrompt, userMessage);
        List<String> skills = new ArrayList<>();
        try {
            String cleaned = stripMarkdownFences(raw);
            skills = objectMapper.readValue(cleaned, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("Failed to parse resume skills JSON, trying comma split: {}", e.getMessage());
            // Fallback: comma-separated plain text
            if (raw != null && !raw.isBlank() && !raw.startsWith("AI")) {
                skills = Arrays.stream(raw.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .limit(20)
                    .collect(Collectors.toList());
            }
        }
        Map<String, Object> result = new HashMap<>();
        result.put("skills", skills);
        return result;
    }

    // ── 9. General Chat Assistant ────────────────────────────────────

    public Map<String, Object> chatAssistant(String userMessage, String history) {
        String systemPrompt =
            "You are BidForge Assistant inside a freelance marketplace. " +
            "You help clients post jobs and freelancers find work.\n\n" +
            "STRICT RULES — follow every one:\n" +
            "1. Ask ONLY ONE question per reply. Never list multiple questions.\n" +
            "2. Keep every reply to 1-2 short sentences maximum. No bullet points. No lists.\n" +
            "3. Collect job details step by step in this order: title → category → budget → key skills.\n" +
            "4. When you have title + category + budget (min & max), output the job data and stop asking.\n\n" +
            "Categories: Software Development, UI/UX Design, Digital Marketing, Data Science, " +
            "Writing & Content, Video & Animation, Finance & Accounting, Legal\n\n" +
            "When ready, append on its own line with NO other text after it:\n" +
            "JOB_DATA:{\"title\":\"...\",\"category\":\"...\",\"budgetMin\":100,\"budgetMax\":500,\"skills\":[\"skill1\",\"skill2\"]}\n\n" +
            "For non-job questions answer in 1 sentence. Never use markdown bullets or numbered lists.";

        String fullUserMessage = (history != null && !history.isBlank())
            ? "Previous context:\n" + history + "\n\nUser: " + safe(userMessage)
            : safe(userMessage);

        String raw = groqClient.chat(systemPrompt, fullUserMessage);
        Map<String, Object> result = new HashMap<>();
        result.put("reply", raw);
        return result;
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private String safe(String s) {
        return s != null ? s : "";
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() > max ? s.substring(0, max) + "..." : s;
    }

    /**
     * Strips ```json ... ``` or ``` ... ``` markdown code fences the LLM sometimes wraps around JSON.
     */
    private String stripMarkdownFences(String raw) {
        if (raw == null) return "";
        String trimmed = raw.trim();
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            if (firstNewline != -1) {
                trimmed = trimmed.substring(firstNewline + 1);
            }
            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.lastIndexOf("```")).trim();
            }
        }
        return trimmed;
    }
}
