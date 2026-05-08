ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
CREATE INDEX idx_users_google_id ON users(google_id);
