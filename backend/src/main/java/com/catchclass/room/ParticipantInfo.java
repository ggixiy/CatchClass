package com.catchclass.room;

import java.util.UUID;

/** Учасник кімнати, уже допущений із кімнати очікування (або організатор). */
public record ParticipantInfo(UUID userId, String displayName, boolean host) {
}