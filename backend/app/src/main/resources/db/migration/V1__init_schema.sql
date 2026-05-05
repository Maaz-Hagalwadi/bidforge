CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    role VARCHAR(20) NOT NULL,
    profile_image_url VARCHAR(500),
    stripe_account_id VARCHAR(255),
    rating DOUBLE PRECISION,
    title VARCHAR(200),
    bio TEXT,
    location VARCHAR(200),
    hourly_rate DOUBLE PRECISION,
    skills TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

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
    client_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE bid (
    id UUID PRIMARY KEY,
    amount DOUBLE PRECISION,
    proposal VARCHAR(1000),
    delivery_days INTEGER,
    job_id UUID REFERENCES job(id),
    freelancer_id BIGINT REFERENCES users(id),
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE contract (
    id UUID PRIMARY KEY,
    job_id UUID REFERENCES job(id),
    client_id BIGINT REFERENCES users(id),
    freelancer_id BIGINT REFERENCES users(id),
    agreed_amount DOUBLE PRECISION,
    delivery_days INTEGER,
    status VARCHAR(50),
    submission_note VARCHAR(255),
    submission_url VARCHAR(255),
    revision_note VARCHAR(255),
    revision_requested_at TIMESTAMP,
    submitted_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE milestone (
    id UUID PRIMARY KEY,
    contract_id UUID REFERENCES contract(id),
    title VARCHAR(255),
    description VARCHAR(255),
    amount DOUBLE PRECISION,
    due_date TIMESTAMP,
    status VARCHAR(50),
    funded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE payment (
    id UUID PRIMARY KEY,
    milestone_id UUID REFERENCES milestone(id),
    amount DOUBLE PRECISION,
    status VARCHAR(50),
    stripe_payment_intent_id VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE notification (
    id UUID PRIMARY KEY,
    title VARCHAR(255),
    message VARCHAR(255),
    type VARCHAR(50),
    read BOOLEAN DEFAULT FALSE,
    user_id BIGINT REFERENCES users(id),
    reference_id UUID,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL,
    created_at TIMESTAMP
);

CREATE TABLE job_invite (
    id UUID PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES job(id),
    freelancer_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(50),
    invited_at TIMESTAMP
);
