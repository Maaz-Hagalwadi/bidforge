package com.bidforge.app.auth.dto;

import com.bidforge.app.user.User;

public record RefreshTokenResult(String token, User user) {}
