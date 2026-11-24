CREATE TABLE chat_room (
    id UUID PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES contract(id) UNIQUE,
    client_id BIGINT NOT NULL,
    freelancer_id BIGINT NOT NULL,
    created_at TIMESTAMP
);

CREATE TABLE message (
    id UUID PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES chat_room(id),
    sender_id BIGINT NOT NULL,
    sender_name VARCHAR(255),
    content TEXT,
    file_url VARCHAR(500),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP
);
CREATE INDEX idx_message_room ON message(room_id);
CREATE INDEX idx_message_sender ON message(sender_id);
