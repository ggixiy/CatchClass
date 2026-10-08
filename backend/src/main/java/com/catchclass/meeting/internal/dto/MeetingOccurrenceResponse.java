package com.catchclass.meeting.internal.dto;

import java.time.Instant;
import java.util.UUID;

public record MeetingOccurrenceResponse(
        UUID meetingId, String publicId, String title, Instant startTime, Instant endTime, boolean recurring
) {
}