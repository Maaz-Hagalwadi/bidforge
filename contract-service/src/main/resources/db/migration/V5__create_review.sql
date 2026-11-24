CREATE TABLE review (
    id UUID PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES contract(id),
    reviewer_id BIGINT NOT NULL,
    reviewee_id BIGINT NOT NULL,
    reviewer_name VARCHAR(255),
    reviewee_name VARCHAR(255),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP,
    UNIQUE (contract_id, reviewer_id)
);
CREATE INDEX idx_review_reviewee ON review(reviewee_id);
CREATE INDEX idx_review_contract ON review(contract_id);
