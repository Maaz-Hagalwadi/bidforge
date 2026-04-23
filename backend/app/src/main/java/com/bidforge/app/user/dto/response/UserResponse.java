package com.bidforge.app.user.dto.response;

import com.bidforge.app.user.Role;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private String phoneNumber;
    private Role role;
    private Double rating;
}