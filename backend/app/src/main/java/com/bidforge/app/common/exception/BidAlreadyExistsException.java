package com.bidforge.app.common.exception;

public class BidAlreadyExistsException extends RuntimeException {
    public BidAlreadyExistsException(String message) {
        super(message);
    }
}
