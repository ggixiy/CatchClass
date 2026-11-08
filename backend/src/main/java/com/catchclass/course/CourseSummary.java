package com.catchclass.course;

import java.util.UUID;

public record CourseSummary(UUID id, String title, UUID ownerUserId) {
}
