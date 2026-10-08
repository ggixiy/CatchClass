CREATE TABLE meetings.meetings (
    id                 UUID PRIMARY KEY,
    public_id          VARCHAR(9) NOT NULL UNIQUE,
    password           VARCHAR(20),
    host_user_id       UUID NOT NULL,
    title              VARCHAR(200) NOT NULL,
    description        VARCHAR(2000),
    start_time         TIMESTAMPTZ NOT NULL,
    duration_minutes   INTEGER NOT NULL,
    recurrence_rule    VARCHAR(20) NOT NULL,
    recurrence_ends_at TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_meetings_host_user_id ON meetings.meetings (host_user_id);