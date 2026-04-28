package com.bidforge.app.common.exception;

public class InviteAlreadyProcessedException extends RuntimeException {
    public InviteAlreadyProcessedException(String message) {
        super(message);
    }
}
