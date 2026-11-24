package com.bidforge.auth.common.exception;

public class OtpAlreadyUsedException extends RuntimeException {
    public OtpAlreadyUsedException(String message) { super(message); }
}
