CREATE TABLE bid (
    id UUID PRIMARY KEY,
    amount DOUBLE PRECISION,
    proposal VARCHAR(1000),
    delivery_days INTEGER,
    job_id UUID NOT NULL REFERENCES job(id),
    -- No FK to users table
    freelancer_id BIGINT NOT NULL,
    freelancer_email VARCHAR(255),
    freelancer_name VARCHAR(255),
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_bid_job_id ON bid(job_id);
CREATE INDEX idx_bid_freelancer_id ON bid(freelancer_id);
