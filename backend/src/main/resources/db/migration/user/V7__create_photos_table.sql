CREATE TABLE users.photos (
    user_id      UUID PRIMARY KEY,
    content_type VARCHAR(100) NOT NULL,
    data         BYTEA NOT NULL,
    updated_at   TIMESTAMPTZ NOT NULL
);