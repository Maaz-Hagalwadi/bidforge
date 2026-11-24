CREATE TABLE portfolio_item (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    project_url VARCHAR(500),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX idx_portfolio_user_id ON portfolio_item(user_id);
