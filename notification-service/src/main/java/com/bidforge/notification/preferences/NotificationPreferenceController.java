package com.bidforge.notification.preferences;

import com.bidforge.notification.auth.UserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users/me/notification-preferences")
@RequiredArgsConstructor
public class NotificationPreferenceController {

    private final NotificationPreferenceService service;

    private UserInfo currentUser() {
        return (UserInfo) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping
    public NotificationPreferenceDto getPreferences() {
        return service.getOrCreate(currentUser().id());
    }

    @PatchMapping
    public NotificationPreferenceDto updatePreferences(@RequestBody NotificationPreferenceDto dto) {
        return service.update(currentUser().id(), dto);
    }
}
