package com.catchclass.room;

import java.time.Instant;
import java.util.UUID;

/**
 * Одне безперервне перебування людини в кімнаті заняття (для журналу відвідуваності).
 * occurrenceStart — початок проведення за розкладом, до якого сеанс прив'язаний при вході (може бути null у старих записів).
 */
public record AttendanceRecord(UUID meetingId, UUID userId, Instant joinedAt, Instant endedAt, Instant occurrenceStart) {
}
