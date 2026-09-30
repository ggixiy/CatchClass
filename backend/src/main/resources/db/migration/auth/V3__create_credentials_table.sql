CREATE TABLE auth.credentials (
    user_id       UUID PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL
);