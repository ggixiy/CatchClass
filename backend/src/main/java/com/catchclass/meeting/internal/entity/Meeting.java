package com.catchclass.meeting.internal.entity;

import java.time.Instant;
import java.util.UUID;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
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

    // Якщо false — учасники потрапляють у кімнату одразу, без черги на допуск організатором.
    @Column(name = "waiting_room_enabled", nullable = false)
    private boolean waitingRoomEnabled;

    // "New meeting" (миттєвий запуск): не показується в календарі запланованих занять
    // і не бере участі в перевірці конфліктів розкладу. Встановлюється лише при створенні.
    @Column(nullable = false)
    private boolean instant;

    // Курс, якому належить заняття (null — звичайне заняття без курсу).
    @Column(name = "course_id")
    private UUID courseId;

    // Початки проведень серії, які видалили поодинці (решта серії лишається).
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "meeting_skipped_occurrences", schema = "meetings",
            joinColumns = @JoinColumn(name = "meeting_id"))
    @Column(name = "start_time", nullable = false)
    private Set<Instant> skippedStarts = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Meeting() {
    }

    public Meeting(UUID id, String publicId, String password, UUID hostUserId, String title, String description,
                   Instant startTime, int durationMinutes, RecurrenceRule recurrenceRule, Instant recurrenceEndsAt,
                   boolean waitingRoomEnabled, boolean instant) {
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
        this.waitingRoomEnabled = waitingRoomEnabled;
        this.instant = instant;
        this.createdAt = Instant.now();
    }

    public void update(String title, String description, Instant startTime, int durationMinutes,
                       RecurrenceRule recurrenceRule, Instant recurrenceEndsAt, String password,
                       boolean waitingRoomEnabled) {
        this.title = title;
        this.description = description;
        this.startTime = startTime;
        this.durationMinutes = durationMinutes;
        this.recurrenceRule = recurrenceRule;
        this.recurrenceEndsAt = recurrenceEndsAt;
        this.password = password;
        this.waitingRoomEnabled = waitingRoomEnabled;
        // Розклад міг змінитись — старі винятки вже не відповідають новим датам.
        this.skippedStarts.clear();
    }

    public void skipOccurrence(Instant start) {
        this.skippedStarts.add(start);
    }

    public Set<Instant> getSkippedStarts() { return skippedStarts; }

    public void assignToCourse(UUID courseId) {
        this.courseId = courseId;
    }

    public UUID getCourseId() { return courseId; }

    public void changeWaitingRoom(boolean enabled) {
        this.waitingRoomEnabled = enabled;
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
    public boolean isWaitingRoomEnabled() { return waitingRoomEnabled; }
    public boolean isInstant() { return instant; }
}
