package com.bidforge.auth.common.exception;

public class OtpExpiredException extends RuntimeException {
    public OtpExpiredException(String message) { super(message); }
}
