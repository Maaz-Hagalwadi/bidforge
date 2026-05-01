package com.bidforge.app.user;

import com.bidforge.app.user.dto.request.UpdateUserRequest;
import com.bidforge.app.user.dto.response.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/search")
    @PreAuthorize("hasRole('CLIENT')")
    public List<UserResponse> searchFreelancers(@RequestParam String q) {
        return userService.searchFreelancers(q);
    }

    @GetMapping("/me")
    public UserResponse getProfile() {
        return userService.getCurrentUser();
    }

    @GetMapping("/{id}")
    public UserResponse getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @PatchMapping("/me")
    public UserResponse updateProfile(@Valid @RequestBody UpdateUserRequest request) {
        return userService.updateCurrentUser(request);
    }
}