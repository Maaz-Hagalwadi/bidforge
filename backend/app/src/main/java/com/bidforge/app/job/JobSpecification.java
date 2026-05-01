package com.bidforge.app.job;

import com.bidforge.app.job.enums.JobStatus;
import com.bidforge.app.job.enums.Visibility;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.UUID;

public class JobSpecification {

    public static Specification<Job> isOpenAndPublic() {
        return (root, query, cb) -> cb.and(
                cb.equal(root.get("status"), JobStatus.OPEN),
                cb.equal(root.get("visibility"), Visibility.PUBLIC)
        );
    }

    /**
     * OPEN + PUBLIC, or OPEN + INVITE_ONLY where the job id is in the invited set.
     */
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

    /** Exclude jobs owned by the given client id. */
    public static Specification<Job> excludeClientJobs(Long clientId) {
        return (root, query, cb) -> cb.notEqual(root.get("client").get("id"), clientId);
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
                cb.lessThanOrEqualTo(root.get("deadline"), java.time.LocalDateTime.parse(deadline));
    }

    public static Specification<Job> keywordSearch(String keyword) {
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("title")), "%" + keyword.toLowerCase() + "%"),
                cb.like(cb.lower(root.get("description")), "%" + keyword.toLowerCase() + "%")
        );
    }

    public static Specification<Job> postedAfter(java.time.LocalDateTime date) {
        return (root, query, cb) ->
                cb.greaterThanOrEqualTo(root.get("createdAt"), date);
    }
}
