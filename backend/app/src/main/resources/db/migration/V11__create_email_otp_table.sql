CREATE TABLE email_otp (
    id BIGSERIAL PRIMARY KEY,

    email VARCHAR(255) NOT NULL,

    otp VARCHAR(10) NOT NULL,

    created_at TIMESTAMP NOT NULL,

    expires_at TIMESTAMP NOT NULL,

    used BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_email_otp_email
ON email_otp(email);