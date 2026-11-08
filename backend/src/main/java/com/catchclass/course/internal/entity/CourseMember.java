package com.catchclass.course.internal.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "course_members", schema = "courses")
public class CourseMember {

    @Id
    private UUID id;

    @Column(name = "course_id", nullable = false)
    private UUID courseId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    protected CourseMember() {
    }

    public CourseMember(UUID courseId, UUID userId) {
        this.id = UUID.randomUUID();
        this.courseId = courseId;
        this.userId = userId;
        this.joinedAt = Instant.now();
    }

    public UUID getCourseId() { return courseId; }
    public UUID getUserId() { return userId; }
    public Instant getJoinedAt() { return joinedAt; }
}
