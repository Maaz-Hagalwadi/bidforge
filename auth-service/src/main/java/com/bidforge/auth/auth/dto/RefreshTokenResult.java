package com.bidforge.auth.auth.dto;

import com.bidforge.auth.user.User;

public record RefreshTokenResult(String token, User user) {}
