package com.bidforge.app.ai;

import com.bidforge.app.ai.dto.*;
import com.bidforge.app.bid.BidRepository;
import com.bidforge.app.job.Job;
import com.bidforge.app.job.JobRepository;
import com.bidforge.app.job.enums.JobStatus;
import com.bidforge.app.job.enums.Visibility;
import com.bidforge.app.user.User;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

    private final GeminiService gemini;
    private final JobRepository jobRepository;
    private final BidRepository bidRepository;

    private User currentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    // ── Feature 1: Job Description Generator ──────────────────────

    @PostMapping("/generate-description")
    public ResponseEntity<GenerateDescriptionResponse> generateDescription(
            @RequestBody GenerateDescriptionRequest req) {

        String prompt = String.format(
            "You are a professional job posting writer for a freelance marketplace.\n\n" +
            "Job Title: %s\nCategory: %s\nClient notes: %s\n\n" +
            "Write a professional job description with 3 short paragraphs (~180 words total) covering:\n" +
            "1. Project overview\n2. Key responsibilities and deliverables\n3. What makes an ideal candidate\n\n" +
            "After the description, on a NEW line write exactly:\nSKILLS: skill1, skill2, skill3, skill4, skill5\n\n" +
            "List 5-8 relevant skills. Keep everything concise and professional.",
            safe(req.getTitle()), safe(req.getCategory()), safe(req.getNotes())
        );

        String raw = gemini.generate(prompt, 500);

        String description = raw;
        List<String> skills = new ArrayList<>();

        int skillsIdx = raw.lastIndexOf("SKILLS:");
        if (skillsIdx != -1) {
            description = raw.substring(0, skillsIdx).trim();
            String skillLine = raw.substring(skillsIdx + 7).trim();
            skills = Arrays.stream(skillLine.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(new GenerateDescriptionResponse(description, skills));
    }

    // ── Feature 2: Proposal Writer ────────────────────────────────

    @PostMapping("/generate-proposal")
    public ResponseEntity<GenerateProposalResponse> generateProposal(
            @RequestBody GenerateProposalRequest req) {

        User user = currentUser();

        String prompt = String.format(
            "You are an expert freelancer writing a winning bid proposal.\n\n" +
            "Freelancer profile:\nName: %s\nTitle: %s\nSkills: %s\nBio: %s\n\n" +
            "Job:\nTitle: %s\nDescription: %s\nRequired skills: %s\n\n" +
            "Write a compelling, personalized bid proposal in EXACTLY under 950 characters.\n" +
            "Be specific, mention matching skills, and propose a clear approach.\n" +
            "Write in first person. No fluff. No greetings like \"Dear client\".\n" +
            "Output ONLY the proposal text, nothing else.",
            safe(user.getName()), safe(user.getTitle()), safe(user.getSkills()),
            truncate(user.getBio(), 200),
            safe(req.getJobTitle()), truncate(req.getJobDescription(), 400),
            safe(req.getRequiredSkills())
        );

        String proposal = gemini.generate(prompt, 400);
        if (proposal.length() > 950) proposal = proposal.substring(0, 950);

        return ResponseEntity.ok(new GenerateProposalResponse(proposal.trim()));
    }

    // ── Feature 3: Milestone Planner ──────────────────────────────

    @PostMapping("/suggest-milestones")
    public ResponseEntity<SuggestMilestonesResponse> suggestMilestones(
            @RequestBody SuggestMilestonesRequest req) {

        String prompt = String.format(
            "You are a project manager. Suggest milestones for this freelance project.\n\n" +
            "Project: %s\nDescription: %s\nTotal budget: $%.2f\nTimeline: %d days\n\n" +
            "Return ONLY a valid JSON array (no markdown, no explanation):\n" +
            "[{\"title\":\"...\",\"description\":\"...\",\"amount\":0.00,\"dueDays\":0},...]\n\n" +
            "Rules:\n- Suggest 3-5 milestones\n- amounts must sum to EXACTLY %.2f\n" +
            "- dueDays is days from contract start (last one = %d)\n" +
            "- Keep titles short (under 50 chars), descriptions clear (under 100 chars)",
            safe(req.getJobTitle()), truncate(req.getJobDescription(), 300),
            req.getTotalAmount(), req.getDeliveryDays(),
            req.getTotalAmount(), req.getDeliveryDays()
        );

        List<MilestoneSuggestion> milestones = gemini.generateJson(
                prompt, 600, new TypeReference<List<MilestoneSuggestion>>() {}
        );

        // Normalise amounts if they don't sum correctly
        double total = milestones.stream().mapToDouble(m -> m.getAmount() != null ? m.getAmount() : 0).sum();
        if (Math.abs(total - req.getTotalAmount()) > 0.01 && total > 0) {
            double ratio = req.getTotalAmount() / total;
            milestones.forEach(m -> m.setAmount(Math.round(m.getAmount() * ratio * 100.0) / 100.0));
            double newSum = milestones.stream().mapToDouble(MilestoneSuggestion::getAmount).sum();
            MilestoneSuggestion last = milestones.get(milestones.size() - 1);
            last.setAmount(Math.round((last.getAmount() + req.getTotalAmount() - newSum) * 100.0) / 100.0);
        }

        return ResponseEntity.ok(new SuggestMilestonesResponse(milestones));
    }

    // ── Feature 4: Job Recommendations ───────────────────────────

    @GetMapping("/job-recommendations")
    public ResponseEntity<List<JobRecommendation>> jobRecommendations() {
        User user = currentUser();

        List<Job> openJobs = jobRepository.findByStatusOrderByCreatedAtDesc(
                JobStatus.OPEN,
                PageRequest.of(0, 50, Sort.by("createdAt").descending())
        ).getContent();

        Set<UUID> biddedJobIds = bidRepository.findByFreelancer(user)
                .stream().map(b -> b.getJob().getId()).collect(Collectors.toSet());

        List<Job> candidates = openJobs.stream()
                .filter(j -> j.getVisibility() == Visibility.PUBLIC)
                .filter(j -> !biddedJobIds.contains(j.getId()))
                .limit(30)
                .collect(Collectors.toList());

        if (candidates.isEmpty()) return ResponseEntity.ok(Collections.emptyList());

        StringBuilder jobList = new StringBuilder();
        Map<String, Job> jobMap = new LinkedHashMap<>();
        for (Job j : candidates) {
            String id = j.getId().toString();
            jobMap.put(id, j);
            jobList.append(id).append("|")
                   .append(safe(j.getTitle())).append("|")
                   .append(safe(j.getCategory())).append("|")
                   .append(truncate(j.getRequiredSkills(), 60)).append("|")
                   .append(j.getBudgetMin() != null ? "$" + j.getBudgetMin().intValue() : "?")
                   .append("-")
                   .append(j.getBudgetMax() != null ? "$" + j.getBudgetMax().intValue() : "?")
                   .append("\n");
        }

        String prompt = String.format(
            "You are a job-matching AI for a freelance marketplace.\n\n" +
            "Freelancer profile:\nSkills: %s\nTitle: %s\nBio: %s\n\n" +
            "Open jobs (format: id|title|category|skills|budget):\n%s\n" +
            "Return the top 5 best matching jobs as a JSON array (no markdown):\n" +
            "[{\"jobId\":\"uuid\",\"matchScore\":85,\"matchReason\":\"one sentence why\"}]\n\n" +
            "Rank by skill overlap and relevance. matchScore is 0-100.",
            safe(user.getSkills()), safe(user.getTitle()),
            truncate(user.getBio(), 150), jobList.toString()
        );

        List<RankedJob> ranked;
        try {
            ranked = gemini.generateJson(prompt, 400, new TypeReference<List<RankedJob>>() {});
        } catch (Exception e) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<JobRecommendation> result = ranked.stream()
                .filter(r -> jobMap.containsKey(r.jobId()))
                .map(r -> {
                    Job j = jobMap.get(r.jobId());
                    return new JobRecommendation(
                            j.getId().toString(), j.getTitle(),
                            r.matchScore(), r.matchReason(),
                            j.getBudgetMin(), j.getBudgetMax(),
                            j.getCategory(), j.getRequiredSkills()
                    );
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // ── Feature 5: Profile Optimizer ─────────────────────────────

    @PostMapping("/optimize-profile")
    public ResponseEntity<ProfileSuggestions> optimizeProfile() {
        User user = currentUser();

        String prompt = String.format(
            "You are a career coach for a freelance marketplace. Analyze this profile and suggest improvements.\n\n" +
            "Current profile:\nName: %s\nTitle: %s\nBio: %s\nSkills: %s\nHourly Rate: %s\nRating: %s\n\n" +
            "Respond with ONLY a valid JSON object (no markdown):\n" +
            "{\"bioRewrite\":\"improved bio under 300 chars\",\"titleSuggestion\":\"improved title under 80 chars\"," +
            "\"skillsToAdd\":[\"skill1\",\"skill2\",\"skill3\"],\"overallScore\":75," +
            "\"feedback\":\"one concise sentence of actionable advice\"}",
            safe(user.getName()), safe(user.getTitle()), safe(user.getBio()),
            safe(user.getSkills()),
            user.getHourlyRate() != null ? "$" + user.getHourlyRate() + "/hr" : "not set",
            user.getRating() != null ? user.getRating().toString() : "no ratings yet"
        );

        ProfileSuggestions suggestions = gemini.generateJson(prompt, 500, ProfileSuggestions.class);
        return ResponseEntity.ok(suggestions);
    }

    // ── Feature 6: Bid Price Recommendation ──────────────────────

    @PostMapping("/bid-price")
    public ResponseEntity<BidPriceResponse> bidPrice(@RequestBody BidPriceRequest req) {
        String budgetHint = (req.getBudgetMin() != null && req.getBudgetMax() != null)
            ? String.format(" The client's budget is $%.0f–$%.0f.", req.getBudgetMin(), req.getBudgetMax())
            : "";

        String prompt = String.format(
            "You are a freelance bidding advisor.%s\n\n" +
            "Job: %s\nDescription: %s\nRequired skills: %s\n\n" +
            "Suggest three bid amounts in USD that a freelancer could offer:\n" +
            "- lowBid: a competitive low price to increase win chances\n" +
            "- competitiveBid: a fair market-rate price\n" +
            "- premiumBid: a premium price reflecting high quality\n\n" +
            "Return ONLY valid JSON (no markdown):\n" +
            "{\"lowBid\":0,\"competitiveBid\":0,\"premiumBid\":0,\"reasoning\":\"one sentence\"}\n\n" +
            "All amounts must be positive integers. reasoning must be under 100 chars.",
            budgetHint, safe(req.getJobTitle()),
            truncate(req.getJobDescription(), 300), safe(req.getRequiredSkills())
        );

        BidPriceResponse resp = gemini.generateJson(prompt, 200, BidPriceResponse.class);
        return ResponseEntity.ok(resp);
    }

    // ── Feature 7: Interview Questions Generator ──────────────────

    @PostMapping("/interview-questions")
    public ResponseEntity<InterviewQuestionsResponse> interviewQuestions(
            @RequestBody InterviewQuestionsRequest req) {

        String prompt = String.format(
            "You are a technical interviewer. Generate 6 concise interview questions to evaluate " +
            "a freelancer for this job.\n\n" +
            "Job: %s\nDescription: %s\nRequired skills: %s\n\n" +
            "Return ONLY a valid JSON array of strings (no markdown, no explanation):\n" +
            "[\"question 1\",\"question 2\",...]",
            safe(req.getJobTitle()),
            truncate(req.getJobDescription(), 300),
            safe(req.getRequiredSkills())
        );

        List<String> questions = gemini.generateJson(
                prompt, 400, new TypeReference<List<String>>() {}
        );
        return ResponseEntity.ok(new InterviewQuestionsResponse(questions));
    }

    // ── Feature 8: Resume Skill Extraction ───────────────────────

    @PostMapping(value = "/extract-resume-skills", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResumeSkillsResponse> extractResumeSkills(
            @RequestParam("file") MultipartFile file) {

        if (file.getSize() > 5_000_000) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "File must be under 5 MB");
        }

        String text;
        String contentType = file.getContentType() != null ? file.getContentType() : "";
        if (contentType.contains("pdf") || file.getOriginalFilename() != null
                && file.getOriginalFilename().toLowerCase().endsWith(".pdf")) {
            try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
                text = new PDFTextStripper().getText(doc);
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read PDF file");
            }
        } else {
            try {
                text = new String(file.getBytes(), java.nio.charset.StandardCharsets.UTF_8);
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read file");
            }
        }

        if (text.length() > 3000) text = text.substring(0, 3000);

        String prompt = String.format(
            "Extract all technical skills, programming languages, frameworks, tools, and technologies " +
            "from this resume text. Return ONLY a valid JSON array of skill strings (no markdown):\n" +
            "[\"React\",\"Java\",...]\n\nMax 20 items. Resume text:\n%s", text
        );

        List<String> skills = gemini.generateJson(
                prompt, 300, new TypeReference<List<String>>() {}
        );
        return ResponseEntity.ok(new ResumeSkillsResponse(skills));
    }

    // ── Feature 9: Dashboard Chatbot ─────────────────────────────

    private static final String CHAT_SYSTEM_PROMPT =
        "You are BidForge Assistant inside a freelance marketplace. You help clients post jobs.\n\n" +
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

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest req) {
        String reply = gemini.chat(
            CHAT_SYSTEM_PROMPT,
            req.getHistory(),
            req.getMessage()
        );
        return ResponseEntity.ok(new ChatResponse(reply));
    }

    // ── Helpers ───────────────────────────────────────────────────

    private String safe(String s) { return s != null ? s : ""; }

    private String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() > max ? s.substring(0, max) + "..." : s;
    }

    record RankedJob(String jobId, int matchScore, String matchReason) {}
}
