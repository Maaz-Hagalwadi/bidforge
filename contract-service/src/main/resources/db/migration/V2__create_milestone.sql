CREATE TABLE milestone (
    id UUID PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES contract(id),
    title VARCHAR(255),
    description VARCHAR(500),
    amount DOUBLE PRECISION,
    due_date TIMESTAMP,
    status VARCHAR(50),
    funded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_milestone_contract_id ON milestone(contract_id);
