package com.catchclass.meeting.internal.dto;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.catchclass.meeting.internal.entity.RecurrenceRule;

public record CreateMeetingRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 2000) String description,
        @NotNull Instant startTime,
        @Min(5) @Max(480) int durationMinutes,
        @NotNull RecurrenceRule recurrence,
        Instant recurrenceEndsAt, // null: повторюється без визначеної дати завершення
        boolean requirePassword,
        @Size(max = 20) String password,
        boolean waitingRoomEnabled
) {
}
