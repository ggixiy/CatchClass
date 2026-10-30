package com.catchclass.meeting;

import java.util.UUID;

public record MeetingAccess(UUID id, String publicId, String title, UUID hostUserId, boolean waitingRoomEnabled,
                            String password) {
}
