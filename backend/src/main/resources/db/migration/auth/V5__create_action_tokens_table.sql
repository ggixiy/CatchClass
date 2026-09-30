CREATE TABLE auth.action_tokens (
    token_hash  VARCHAR(64) PRIMARY KEY,
    user_id     UUID NOT NULL,
    type        VARCHAR(30) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_action_tokens_user_id ON auth.action_tokens (user_id);