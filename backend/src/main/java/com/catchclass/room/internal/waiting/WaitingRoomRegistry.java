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

    /**
     * autoAdmit — true для організатора, а також для будь-кого, якщо в заняття вимкнена
     * кімната очікування: такий гість одразу отримує статус ADMITTED, без черги на допуск.
     */
    public WaitingGuest putIfAbsent(UUID meetingId, UUID userId, String displayName, boolean host, boolean autoAdmit) {
        Map<UUID, WaitingGuest> guests = byMeeting.computeIfAbsent(meetingId, k -> new ConcurrentHashMap<>());
        return guests.computeIfAbsent(userId, id ->
                new WaitingGuest(userId, displayName, host, autoAdmit ? GuestStatus.ADMITTED : GuestStatus.WAITING));
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

    /** Усі допущені учасники кімнати — для показу фото інших учасників у зустрічі. */
    public Collection<WaitingGuest> listAdmitted(UUID meetingId) {
        Map<UUID, WaitingGuest> guests = byMeeting.get(meetingId);
        if (guests == null) {
            return List.of();
        }
        return guests.values().stream().filter(g -> g.getStatus() == GuestStatus.ADMITTED).toList();
    }

    public void clear(UUID meetingId) {
        byMeeting.remove(meetingId);
    }

    // Гість сам відмовився чекати: прибираємо його запис, щоб наступна спроба
    // приєднатись (якщо буде) почалась із чистого аркуша, а не зі старого статусу.
    public void remove(UUID meetingId, UUID userId) {
        Map<UUID, WaitingGuest> guests = byMeeting.get(meetingId);
        if (guests != null) {
            guests.remove(userId);
        }
    }
}
