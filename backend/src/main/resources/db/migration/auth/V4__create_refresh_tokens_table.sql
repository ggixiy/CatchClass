CREATE TABLE auth.refresh_tokens (
    token_hash  VARCHAR(64) PRIMARY KEY,
    user_id     UUID NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_refresh_tokens_user_id ON auth.refresh_tokens (user_id);