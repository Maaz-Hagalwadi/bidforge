package com.bidforge.job.job;

import com.bidforge.job.job.enums.ExperienceLevel;
import com.bidforge.job.job.enums.JobStatus;
import com.bidforge.job.job.enums.UrgencyLevel;
import com.bidforge.job.job.enums.Visibility;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class JobSpecification {

    public static Specification<Job> isOpenAndPublic() {
        return (root, query, cb) -> cb.and(
                cb.equal(root.get("status"), JobStatus.OPEN),
                cb.equal(root.get("visibility"), Visibility.PUBLIC)
        );
    }

    public static Specification<Job> isOpenAndVisible(List<UUID> invitedJobIds) {
        return (root, query, cb) -> {
            var openPublic = cb.and(
                    cb.equal(root.get("status"), JobStatus.OPEN),
                    cb.equal(root.get("visibility"), Visibility.PUBLIC)
            );
            if (invitedJobIds == null || invitedJobIds.isEmpty()) {
                return openPublic;
            }
            var openInvited = cb.and(
                    cb.equal(root.get("status"), JobStatus.OPEN),
                    cb.equal(root.get("visibility"), Visibility.INVITE_ONLY),
                    root.get("id").in(invitedJobIds)
            );
            return cb.or(openPublic, openInvited);
        };
    }

    // Key change from monolith: root.get("client").get("id") → root.get("clientId")
    // because Job.client was @ManyToOne User; now it's a plain Long field
    public static Specification<Job> excludeClientJobs(Long clientId) {
        return (root, query, cb) -> cb.notEqual(root.get("clientId"), clientId);
    }

    public static Specification<Job> hasCategory(String category) {
        return (root, query, cb) ->
                cb.like(cb.lower(root.get("category")), "%" + category.toLowerCase() + "%");
    }

    public static Specification<Job> hasMinBudget(Double min) {
        return (root, query, cb) ->
                cb.greaterThanOrEqualTo(root.get("budgetMin"), min);
    }

    public static Specification<Job> hasMaxBudget(Double max) {
        return (root, query, cb) ->
                cb.lessThanOrEqualTo(root.get("budgetMax"), max);
    }

    public static Specification<Job> hasSkills(String skills) {
        return (root, query, cb) ->
                cb.like(cb.lower(root.get("requiredSkills")), "%" + skills.toLowerCase() + "%");
    }

    public static Specification<Job> hasDeadlineBefore(String deadline) {
        return (root, query, cb) ->
                cb.lessThanOrEqualTo(root.get("deadline"), LocalDateTime.parse(deadline));
    }

    public static Specification<Job> keywordSearch(String keyword) {
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("title")), "%" + keyword.toLowerCase() + "%"),
                cb.like(cb.lower(root.get("description")), "%" + keyword.toLowerCase() + "%")
        );
    }

    public static Specification<Job> postedAfter(LocalDateTime date) {
        return (root, query, cb) ->
                cb.greaterThanOrEqualTo(root.get("createdAt"), date);
    }

    public static Specification<Job> hasExperienceLevel(ExperienceLevel level) {
        return (root, query, cb) -> cb.equal(root.get("experienceLevel"), level);
    }

    public static Specification<Job> hasUrgencyLevel(UrgencyLevel level) {
        return (root, query, cb) -> cb.equal(root.get("urgencyLevel"), level);
    }
}
