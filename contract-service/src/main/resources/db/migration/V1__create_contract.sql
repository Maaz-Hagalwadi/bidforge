CREATE TABLE contract (
    id UUID PRIMARY KEY,
    job_id UUID NOT NULL,
    job_title VARCHAR(255),
    job_deadline VARCHAR(50),
    client_id BIGINT NOT NULL,
    client_email VARCHAR(255),
    client_name VARCHAR(255),
    freelancer_id BIGINT NOT NULL,
    freelancer_email VARCHAR(255),
    freelancer_name VARCHAR(255),
    agreed_amount DOUBLE PRECISION,
    delivery_days INTEGER,
    status VARCHAR(50),
    submission_note VARCHAR(500),
    submission_url VARCHAR(500),
    submitted_at TIMESTAMP,
    revision_note VARCHAR(500),
    revision_requested_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE (job_id)
);

CREATE INDEX idx_contract_client_id ON contract(client_id);
CREATE INDEX idx_contract_freelancer_id ON contract(freelancer_id);
