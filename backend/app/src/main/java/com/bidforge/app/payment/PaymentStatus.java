package com.bidforge.app.payment;

public enum PaymentStatus {
    PENDING,   // not funded
    ESCROWED,  // money locked
    RELEASED,  // paid to freelancer
    REFUNDED
}