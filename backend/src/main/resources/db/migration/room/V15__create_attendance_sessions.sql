-- Сеанси присутності: один рядок на безперервне перебування людини в кімнаті.
-- last_seen_at оновлюється heartbeat'ом клієнта; left_at ставиться при виході.
CREATE TABLE rooms.attendance_sessions (
    id           UUID PRIMARY KEY,
    meeting_id   UUID NOT NULL,
    user_id      UUID NOT NULL,
    joined_at    TIMESTAMPTZ NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL,
    left_at      TIMESTAMPTZ
);

CREATE INDEX idx_attendance_meeting_joined ON rooms.attendance_sessions (meeting_id, joined_at);
CREATE INDEX idx_attendance_user ON rooms.attendance_sessions (meeting_id, user_id);
