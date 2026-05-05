package com.bidforge.app.user;

import com.bidforge.app.user.dto.request.PortfolioRequest;
import com.bidforge.app.user.dto.request.UpdateUserRequest;
import com.bidforge.app.user.dto.response.PortfolioResponse;
import com.bidforge.app.user.dto.response.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

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

    @GetMapping("/{id}/portfolio")
    public List<PortfolioResponse> getPortfolio(@PathVariable Long id) {
        return userService.getPortfolio(id);
    }

    @PostMapping("/me/portfolio")
    public PortfolioResponse addPortfolioItem(@Valid @RequestBody PortfolioRequest request) {
        return userService.addPortfolioItem(request);
    }

    @DeleteMapping("/me/portfolio/{itemId}")
    public void deletePortfolioItem(@PathVariable UUID itemId) {
        userService.deletePortfolioItem(itemId);
    }
}