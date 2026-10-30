package com.catchclass.meeting;

import java.time.Instant;
import java.util.UUID;

/**
 * Публікується приблизно за {@code REMINDER_LEAD_MINUTES} хвилин до початку конкретного
 * проведення заняття. Notification-модуль підписується на цю подію, щоб надіслати організатору
 * нагадування листом — сам meeting-модуль нічого не знає про пошту чи дані користувача.
 */
public record MeetingReminderDue(UUID meetingId, String publicId, String title, UUID hostUserId, Instant startTime) {
}
