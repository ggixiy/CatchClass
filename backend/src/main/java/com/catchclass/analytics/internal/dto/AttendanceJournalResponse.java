package com.catchclass.analytics.internal.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Журнал відвідуваності курсу: рядок — студент, стовпець — заняття; у клітинці хвилини присутності (0 — не був). */
public record AttendanceJournalResponse(List<JournalLesson> lessons, List<JournalStudent> students) {

    public record JournalLesson(UUID meetingId, String title, Instant start) {
    }

    public record JournalStudent(UUID userId, String displayName, String email, List<Long> minutes, int attended) {
    }
}
