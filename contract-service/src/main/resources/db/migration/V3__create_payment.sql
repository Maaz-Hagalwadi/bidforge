CREATE TABLE payment (
    id UUID PRIMARY KEY,
    milestone_id UUID NOT NULL REFERENCES milestone(id),
    amount DOUBLE PRECISION,
    status VARCHAR(50),
    stripe_payment_intent_id VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE (milestone_id)
);
