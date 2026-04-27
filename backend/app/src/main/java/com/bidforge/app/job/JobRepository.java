package com.bidforge.app.job;

import com.bidforge.app.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobRepository extends JpaRepository<Job, Long> {
    List<Job> findByClient(User client);
}