CREATE SCHEMA IF NOT EXISTS courses;

CREATE TABLE courses.courses (
    id            UUID PRIMARY KEY,
    title         VARCHAR(200) NOT NULL,
    description   VARCHAR(2000),
    owner_user_id UUID NOT NULL,
    invite_code   VARCHAR(8) NOT NULL UNIQUE,
    created_at    TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_courses_owner ON courses.courses (owner_user_id);

CREATE TABLE courses.course_members (
    id        UUID PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses.courses (id) ON DELETE CASCADE,
    user_id   UUID NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_course_member UNIQUE (course_id, user_id)
);

CREATE INDEX idx_course_members_user ON courses.course_members (user_id);
