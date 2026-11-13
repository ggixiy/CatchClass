package com.catchclass.room;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Публічний API модуля room. Використовується модулем chat (крок 6) для перевірки,
 * чи є користувач допущеним учасником кімнати, перш ніж пускати його в чат.
 */
public interface RoomApi {

    Optional<ParticipantInfo> findParticipant(String meetingPublicId, UUID userId);

    /** Сеанси присутності у вказаних заняттях, що почались у проміжку [from, to]. */
    List<AttendanceRecord> findAttendance(Collection<UUID> meetingIds, Instant from, Instant to);

    default boolean isParticipant(String meetingPublicId, UUID userId) {
        return findParticipant(meetingPublicId, userId).isPresent();
    }
}