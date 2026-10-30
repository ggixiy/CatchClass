package com.catchclass.room.internal.dto;

import java.util.UUID;

/** userId у вигляді рядка — так само, як identity учасника в LiveKit (див. RoomService.generateToken). */
public record ParticipantPhotoResponse(UUID userId, String photoUrl) {
}
