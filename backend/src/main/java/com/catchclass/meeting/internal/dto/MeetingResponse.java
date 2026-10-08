package com.catchclass.meeting.internal.dto;

import java.time.Instant;
import java.util.UUID;

import com.catchclass.meeting.internal.entity.RecurrenceRule;

public record MeetingResponse(
        UUID id, String publicId, String password, String title, String description,
        Instant startTime, int durationMinutes, RecurrenceRule recurrence, Instant recurrenceEndsAt
) {
}