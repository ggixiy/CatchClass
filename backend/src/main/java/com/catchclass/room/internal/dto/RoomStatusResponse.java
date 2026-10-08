package com.catchclass.room.internal.dto;

import java.util.UUID;

public record RoomStatusResponse(
        UUID meetingId, String status, String accessToken, String serverUrl, String roomName
) {
    // status: "WAITING" | "ADMITTED" | "DENIED"
}