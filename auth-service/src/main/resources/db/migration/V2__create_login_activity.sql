CREATE TABLE login_activity (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    ip_address VARCHAR(64),
    city VARCHAR(100),
    country VARCHAR(100),
    country_code VARCHAR(5),
    user_agent VARCHAR(500),
    login_method VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_login_activity_user_id ON login_activity(user_id);
