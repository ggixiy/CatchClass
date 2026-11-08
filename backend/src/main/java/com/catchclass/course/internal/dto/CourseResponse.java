package com.catchclass.course.internal.dto;

import java.time.Instant;
import java.util.UUID;

/** inviteCode бачить лише викладач курсу (для інших — null). */
public record CourseResponse(
        UUID id, String title, String description, UUID ownerUserId, String ownerName, boolean owner,
        String inviteCode, long memberCount, Instant createdAt
) {
}
