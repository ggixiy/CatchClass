package com.catchclass.room.internal.dto;

import java.util.UUID;

public record RoomStatusResponse(
        UUID meetingId, String status, String accessToken, String serverUrl, String roomName, boolean isHost,
        String title, boolean waitingRoomEnabled
) {
    // status: "WAITING" | "ADMITTED" | "DENIED"
}
