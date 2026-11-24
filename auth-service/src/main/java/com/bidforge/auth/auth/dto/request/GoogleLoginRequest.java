package com.bidforge.auth.auth.dto.request;

import com.bidforge.auth.user.Role;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class GoogleLoginRequest {
    @NotBlank(message = "Google access token is required")
    private String accessToken;
    private Role role;
}
