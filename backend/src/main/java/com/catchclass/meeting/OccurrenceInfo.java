package com.catchclass.meeting;

import java.time.Instant;
import java.util.UUID;

/** Одне проведення заняття в розкладі (для модулів, що рахують відвідуваність). */
public record OccurrenceInfo(UUID meetingId, String publicId, String title, Instant start, Instant end,
                             UUID courseId, boolean own) {
}
