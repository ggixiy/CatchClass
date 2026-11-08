package com.catchclass.course.internal.dto;

import java.time.Instant;
import java.util.UUID;

public record CourseMemberResponse(UUID userId, String displayName, String email, String photoUrl, Instant joinedAt, boolean owner) {
}
