CREATE TABLE dispute (
    id UUID PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES contract(id),
    raised_by_id BIGINT NOT NULL,
    raised_by_email VARCHAR(255),
    raised_by_name VARCHAR(255),
    reason VARCHAR(255),
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    resolution TEXT,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX idx_dispute_contract_id ON dispute(contract_id);
CREATE INDEX idx_dispute_raised_by ON dispute(raised_by_id);
