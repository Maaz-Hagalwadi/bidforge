package com.bidforge.app.common.exception;

public class RoleRequiredException extends RuntimeException {
    public RoleRequiredException(String message) {
        super(message);
    }
}
