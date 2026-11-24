package com.bidforge.auth.auth.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class LoginRequest {
    @Email @NotBlank @Size(max = 255)
    private String email;
    @NotBlank
    private String password;
}
