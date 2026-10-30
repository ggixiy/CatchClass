package com.catchclass.room.internal.waiting;

import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Хто з учасників попросив у організатора дозвіл на демонстрацію екрана й ще чекає на
 * рішення. Так само, як і WaitingRoomRegistry, зберігається лише в пам'яті — це не критичні
 * бізнес-дані, і переживати рестарт сервера їм не потрібно.
 */
@Component
public class ScreenShareRequestRegistry {

    private final Map<UUID, Set<UUID>> pendingByMeeting = new ConcurrentHashMap<>();

    public void request(UUID meetingId, UUID userId) {
        pendingByMeeting.computeIfAbsent(meetingId, k -> ConcurrentHashMap.newKeySet()).add(userId);
    }

    /** Прибирає запит після того, як організатор його схвалив або відхилив. */
    public void resolve(UUID meetingId, UUID userId) {
        Set<UUID> pending = pendingByMeeting.get(meetingId);
        if (pending != null) {
            pending.remove(userId);
        }
    }

    public Collection<UUID> listPending(UUID meetingId) {
        return pendingByMeeting.getOrDefault(meetingId, Set.of());
    }

    public void clear(UUID meetingId) {
        pendingByMeeting.remove(meetingId);
    }
}
