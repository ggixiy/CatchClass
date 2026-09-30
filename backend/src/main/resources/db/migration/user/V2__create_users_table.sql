CREATE TABLE users.profiles (
    id            UUID PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    display_name  VARCHAR(100) NOT NULL,
    photo_url     VARCHAR(500),
    created_at    TIMESTAMPTZ NOT NULL,
    updated_at    TIMESTAMPTZ NOT NULL
);