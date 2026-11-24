CREATE TABLE job (
    id UUID PRIMARY KEY,
    title VARCHAR(255),
    category VARCHAR(255),
    description VARCHAR(2000),
    required_skills VARCHAR(255),
    budget_type VARCHAR(50),
    deadline TIMESTAMP,
    budget_min DOUBLE PRECISION,
    budget_max DOUBLE PRECISION,
    experience_level VARCHAR(50),
    urgency_level VARCHAR(50),
    status VARCHAR(50),
    attachment_url VARCHAR(255),
    visibility VARCHAR(50),
    -- No FK to users table — this service has its own DB
    client_id BIGINT NOT NULL,
    client_email VARCHAR(255),
    client_name VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_job_client_id ON job(client_id);
CREATE INDEX idx_job_status ON job(status);
CREATE INDEX idx_job_visibility ON job(visibility);
