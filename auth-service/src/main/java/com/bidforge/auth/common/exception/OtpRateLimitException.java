package com.bidforge.auth.common.exception;

public class OtpRateLimitException extends RuntimeException {
    public OtpRateLimitException(String message) { super(message); }
}
