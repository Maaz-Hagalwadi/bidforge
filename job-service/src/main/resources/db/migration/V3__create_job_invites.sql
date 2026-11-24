CREATE TABLE job_invite (
    id UUID PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES job(id),
    -- No FK to users table
    freelancer_id BIGINT NOT NULL,
    freelancer_email VARCHAR(255),
    freelancer_name VARCHAR(255),
    status VARCHAR(50),
    invited_at TIMESTAMP
);

CREATE INDEX idx_job_invite_job_id ON job_invite(job_id);
CREATE INDEX idx_job_invite_freelancer_id ON job_invite(freelancer_id);

CREATE TABLE job_invitation (
    id UUID PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES job(id),
    freelancer_id BIGINT NOT NULL,
    invited_at TIMESTAMP,
    UNIQUE (job_id, freelancer_id)
);
