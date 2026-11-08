-- Окремі проведення повторюваного заняття, які викладач видалив (сама серія лишається).
CREATE TABLE meetings.meeting_skipped_occurrences (
    meeting_id UUID NOT NULL REFERENCES meetings.meetings (id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (meeting_id, start_time)
);
