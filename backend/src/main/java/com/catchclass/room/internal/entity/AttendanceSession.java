package com.catchclass.room.internal.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "attendance_sessions", schema = "rooms")
public class AttendanceSession {

    @Id
    private UUID id;

    @Column(name = "meeting_id", nullable = false)
    private UUID meetingId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt;

    @Column(name = "last_seen_at", nullable = false)
    private Instant lastSeenAt;

    @Column(name = "left_at")
    private Instant leftAt;

    // Початок проведення заняття (за розкладом), до якого належить цей сеанс; null у старих записів.
    @Column(name = "occurrence_start")
    private Instant occurrenceStart;

    protected AttendanceSession() {
    }

    public AttendanceSession(UUID meetingId, UUID userId, Instant now) {
        this.id = UUID.randomUUID();
        this.meetingId = meetingId;
        this.userId = userId;
        this.joinedAt = now;
        this.lastSeenAt = now;
    }

    public AttendanceSession(UUID meetingId, UUID userId, Instant now, Instant occurrenceStart) {
        this(meetingId, userId, now);
        this.occurrenceStart = occurrenceStart;
    }

    public void touch(Instant now) { this.lastSeenAt = now; }
    public void leave(Instant now) { this.lastSeenAt = now; this.leftAt = now; }

    public UUID getMeetingId() { return meetingId; }
    public UUID getUserId() { return userId; }
    public Instant getJoinedAt() { return joinedAt; }
    public Instant getLastSeenAt() { return lastSeenAt; }
    public Instant getLeftAt() { return leftAt; }
    public Instant getOccurrenceStart() { return occurrenceStart; }
}
