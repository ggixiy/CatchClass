package com.catchclass.room.internal.dto;

import java.time.Instant;
import java.util.UUID;

public record WaitingGuestResponse(UUID userId, String displayName, Instant requestedAt) {
}