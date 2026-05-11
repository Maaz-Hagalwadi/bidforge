package com.bidforge.app.notification.preferences;

import com.bidforge.app.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users/me/notification-preferences")
@RequiredArgsConstructor
public class NotificationPreferenceController {

    private final NotificationPreferenceService service;

    private User currentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping
    public NotificationPreferenceDto getPreferences() {
        return service.getOrCreate(currentUser());
    }

    @PatchMapping
    public NotificationPreferenceDto updatePreferences(@RequestBody NotificationPreferenceDto dto) {
        return service.update(currentUser(), dto);
    }
}
