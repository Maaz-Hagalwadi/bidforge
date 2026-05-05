CREATE TABLE IF NOT EXISTS chat_room (
    id UUID PRIMARY KEY,
    contract_id UUID REFERENCES contract(id),
    client_id BIGINT REFERENCES users(id),
    freelancer_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS message (
    id UUID PRIMARY KEY,
    chat_room_id UUID REFERENCES chat_room(id),
    sender_id BIGINT REFERENCES users(id),
    content TEXT,
    sent_at TIMESTAMP
);
