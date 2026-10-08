package com.catchclass.room;

import java.util.Optional;
import java.util.UUID;

/**
 * Публічний API модуля room. Використовується модулем chat (крок 6) для перевірки,
 * чи є користувач допущеним учасником кімнати, перш ніж пускати його в чат.
 */
public interface RoomApi {

    Optional<ParticipantInfo> findParticipant(String meetingPublicId, UUID userId);

    default boolean isParticipant(String meetingPublicId, UUID userId) {
        return findParticipant(meetingPublicId, userId).isPresent();
    }
}