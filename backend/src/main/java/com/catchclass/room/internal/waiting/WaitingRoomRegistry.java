package com.catchclass.room.internal.waiting;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Живий реєстр кімнат очікування: хто чекає, хто вже допущений. Навмисно в памʼяті,
 * а не в БД — цей стан не повинен переживати рестарт сервера. Для кількох інстансів
 * застосунку знадобився б Redis, але це вже поза межами курсової.
 */
@Component
public class WaitingRoomRegistry {

    private final Map<UUID, Map<UUID, WaitingGuest>> byMeeting = new ConcurrentHashMap<>();

    public WaitingGuest putIfAbsent(UUID meetingId, UUID userId, String displayName, boolean host) {
        Map<UUID, WaitingGuest> guests = byMeeting.computeIfAbsent(meetingId, k -> new ConcurrentHashMap<>());
        return guests.computeIfAbsent(userId, id ->
                new WaitingGuest(userId, displayName, host, host ? GuestStatus.ADMITTED : GuestStatus.WAITING));
    }

    public Optional<WaitingGuest> find(UUID meetingId, UUID userId) {
        Map<UUID, WaitingGuest> guests = byMeeting.get(meetingId);
        return guests == null ? Optional.empty() : Optional.ofNullable(guests.get(userId));
    }

    public Collection<WaitingGuest> listWaiting(UUID meetingId) {
        Map<UUID, WaitingGuest> guests = byMeeting.get(meetingId);
        if (guests == null) {
            return List.of();
        }
        return guests.values().stream().filter(g -> g.getStatus() == GuestStatus.WAITING).toList();
    }

    public void clear(UUID meetingId) {
        byMeeting.remove(meetingId);
    }
}