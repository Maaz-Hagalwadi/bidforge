package com.bidforge.app.common.exception;

public class OtpRateLimitException extends RuntimeException {
    public OtpRateLimitException(String message) {
        super(message);
    }
}
