package com.bidforge.app.job.events;

import com.bidforge.app.user.User;

import java.util.UUID;

public record JobCreatedEvent(
        User client,
        UUID jobId
) {}
