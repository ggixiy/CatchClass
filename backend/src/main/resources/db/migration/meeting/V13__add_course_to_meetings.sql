ALTER TABLE meetings.meetings
    ADD COLUMN course_id UUID;

CREATE INDEX idx_meetings_course_id ON meetings.meetings (course_id);
