package com.bidforge.app.user.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {

    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    private String profileImageUrl;

    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    @Size(max = 2000, message = "Bio must not exceed 2000 characters")
    private String bio;

    @Size(max = 200, message = "Location must not exceed 200 characters")
    private String location;

    @DecimalMin(value = "0.0", inclusive = false, message = "Hourly rate must be greater than 0")
    private Double hourlyRate;

    private String skills;

}