package com.bidforge.app.notification;

import com.bidforge.app.job.events.JobCreatedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationService notificationService;

    @EventListener
    public void handleJobCreated(JobCreatedEvent event) {

        notificationService.createNotification(
                event.client(),
                "Job Created",
                "Your job has been posted successfully",
                NotificationType.JOB_CREATED,
                event.jobId()
        );
    }
}
