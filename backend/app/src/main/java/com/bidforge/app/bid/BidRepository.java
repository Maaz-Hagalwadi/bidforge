package com.bidforge.app.bid;

import com.bidforge.app.job.Job;
import com.bidforge.app.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface BidRepository extends JpaRepository<Bid, UUID> {

    boolean existsByJobAndFreelancer(Job job, User freelancer);

    List<Bid> findByJob(Job job);

    Page<Bid> findByJobOrderByCreatedAtDesc(Job job, Pageable pageable);

    List<Bid> findByFreelancer(User freelancer);

    @Query(value = "SELECT COALESCE(j.category, 'Uncategorized') AS label, COUNT(b.id) AS value " +
                   "FROM bid b JOIN job j ON b.job_id = j.id " +
                   "GROUP BY label ORDER BY value DESC", nativeQuery = true)
    List<Object[]> bidsPerCategory();
}
