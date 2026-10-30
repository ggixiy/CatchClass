package com.catchclass.room.internal.dto;

import java.util.UUID;

public record ScreenShareRequestResponse(UUID userId, String displayName) {
}
