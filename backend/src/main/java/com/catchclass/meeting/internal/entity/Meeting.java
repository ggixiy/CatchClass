package com.catchclass.meeting.internal.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "meetings", schema = "meetings")
public class Meeting {

    @Id
    private UUID id;

    @Column(name = "public_id", nullable = false, unique = true)
    private String publicId;

    @Column
    private String password; // null = вхід без пароля

    @Column(name = "host_user_id", nullable = false)
    private UUID hostUserId;

    @Column(nullable = false)
    private String title;

    @Column
    private String description;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    @Enumerated(EnumType.STRING)
    @Column(name = "recurrence_rule", nullable = false)
    private RecurrenceRule recurrenceRule;

    @Column(name = "recurrence_ends_at")
    private Instant recurrenceEndsAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Meeting() {
    }

    public Meeting(UUID id, String publicId, String password, UUID hostUserId, String title, String description,
                   Instant startTime, int durationMinutes, RecurrenceRule recurrenceRule, Instant recurrenceEndsAt) {
        this.id = id;
        this.publicId = publicId;
        this.password = password;
        this.hostUserId = hostUserId;
        this.title = title;
        this.description = description;
        this.startTime = startTime;
        this.durationMinutes = durationMinutes;
        this.recurrenceRule = recurrenceRule;
        this.recurrenceEndsAt = recurrenceEndsAt;
        this.createdAt = Instant.now();
    }

    public void update(String title, String description, Instant startTime, int durationMinutes,
                       RecurrenceRule recurrenceRule, Instant recurrenceEndsAt, String password) {
        this.title = title;
        this.description = description;
        this.startTime = startTime;
        this.durationMinutes = durationMinutes;
        this.recurrenceRule = recurrenceRule;
        this.recurrenceEndsAt = recurrenceEndsAt;
        this.password = password;
    }

    public UUID getId() { return id; }
    public String getPublicId() { return publicId; }
    public String getPassword() { return password; }
    public UUID getHostUserId() { return hostUserId; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public Instant getStartTime() { return startTime; }
    public int getDurationMinutes() { return durationMinutes; }
    public RecurrenceRule getRecurrenceRule() { return recurrenceRule; }
    public Instant getRecurrenceEndsAt() { return recurrenceEndsAt; }
}