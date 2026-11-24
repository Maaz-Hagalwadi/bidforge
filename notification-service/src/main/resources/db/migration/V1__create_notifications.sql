CREATE TABLE notification (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    message VARCHAR(255),
    type VARCHAR(50),
    read BOOLEAN DEFAULT FALSE,
    reference_id UUID,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_notification_user_id ON notification(user_id);
