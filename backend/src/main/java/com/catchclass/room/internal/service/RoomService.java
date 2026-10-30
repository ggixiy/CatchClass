package com.catchclass.room.internal.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import com.catchclass.room.internal.livekit.LiveKitAdminClient;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.catchclass.meeting.MeetingAccess;
import com.catchclass.meeting.MeetingApi;
import com.catchclass.room.ParticipantInfo;
import com.catchclass.room.RoomApi;
import com.catchclass.room.internal.config.LiveKitProperties;
import com.catchclass.room.internal.dto.InviteResponse;
import com.catchclass.room.internal.dto.ParticipantPhotoResponse;
import com.catchclass.room.internal.dto.RoomStatusResponse;
import com.catchclass.room.internal.dto.ScreenShareRequestResponse;
import com.catchclass.room.internal.dto.WaitingGuestResponse;
import com.catchclass.room.internal.waiting.GuestStatus;
import com.catchclass.room.internal.waiting.ScreenShareRequestRegistry;
import com.catchclass.room.internal.waiting.WaitingGuest;
import com.catchclass.room.internal.waiting.WaitingRoomRegistry;
import com.catchclass.shared.web.ApiException;
import com.catchclass.user.UserApi;
import com.catchclass.user.UserSummary;

import io.livekit.server.AccessToken;
import io.livekit.server.CanPublishSources;
import io.livekit.server.CanUpdateOwnMetadata;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;

@Service
public class RoomService implements RoomApi {

    private final MeetingApi meetingApi;
    private final UserApi userApi;
    private final WaitingRoomRegistry registry;
    private final ScreenShareRequestRegistry screenShareRequests;
    private final LiveKitProperties properties;
    private final LiveKitAdminClient adminClient;
    // Заняття, де організатор натиснув «Заглушити всіх»: гості, що приєднаються ПІСЛЯ цього,
    // теж отримують токен без права на мікрофон — доти, доки не буде «Розмутити всіх».
    private final Set<UUID> mutedMeetings = ConcurrentHashMap.newKeySet();
    // Скільки перевірок поспіль кімната з активним «мутом» була порожньою: коли всі вийшли,
    // режим скидаємо, щоб наступна зустріч того ж заняття не починалась із заглушених гостей.
    private final Map<UUID, Integer> emptyTicks = new ConcurrentHashMap<>();
    private static final int EMPTY_TICKS_TO_RESET = 40; // ~1 хвилина при інтервалі 1.5 с
    // Виключені організатором: навіть якщо кімната очікування вимкнена, їхній повторний вхід
    // потребує схвалення — інакше «викинути» людину було б неможливо.
    private final Map<UUID, Set<UUID>> kicked = new ConcurrentHashMap<>();

    public RoomService(MeetingApi meetingApi, UserApi userApi, WaitingRoomRegistry registry,
                       ScreenShareRequestRegistry screenShareRequests, LiveKitProperties properties,
                       LiveKitAdminClient adminClient) {
        this.meetingApi = meetingApi;
        this.userApi = userApi;
        this.registry = registry;
        this.screenShareRequests = screenShareRequests;
        this.properties = properties;
        this.adminClient = adminClient;
    }

    // ---- публічний контракт RoomApi (для модуля chat на кроці 6) ----

    @Override
    public Optional<ParticipantInfo> findParticipant(String meetingPublicId, UUID userId) {
        return meetingApi.findByPublicId(meetingPublicId)
                .flatMap(meeting -> registry.find(meeting.id(), userId))
                .filter(guest -> guest.getStatus() == GuestStatus.ADMITTED)
                .map(guest -> new ParticipantInfo(guest.getUserId(), guest.getDisplayName(), guest.isHost()));
    }

    // ---- для RoomController ----

    /**
     * Організатора допускає миттєво завжди. Гостя — миттєво, якщо в заняття вимкнена
     * кімната очікування, інакше ставить його у чергу на допуск.
     */
    public RoomStatusResponse join(UUID currentUserId, String publicId, String password) {
        MeetingAccess meeting = meetingApi.checkAccess(publicId, password)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "invalid_meeting_credentials",
                        "Неправильний Meeting ID або пароль"));

        UserSummary user = userApi.findById(currentUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "user_not_found", "Користувача не знайдено"));

        boolean isHost = meeting.hostUserId().equals(currentUserId);
        // Раніше відхилену людину (DENIED) пускаємо на нове коло: інакше вона назавжди
        // застрягає зі старим статусом і організатор не бачить нового запиту.
        // Так само з тими, хто раніше вийшов (запис ADMITTED лишився в реєстрі): при увімкненій
        // кімнаті очікування або після викидання новий вхід знову йде через схвалення.
        boolean kickedBefore = kicked.getOrDefault(meeting.id(), Set.of()).contains(currentUserId);
        registry.find(meeting.id(), currentUserId)
                .filter(g -> !isHostUser(meeting, currentUserId))
                .filter(g -> g.getStatus() == GuestStatus.DENIED
                        || (g.getStatus() == GuestStatus.ADMITTED && (meeting.waitingRoomEnabled() || kickedBefore)))
                .ifPresent(g -> registry.remove(meeting.id(), currentUserId));
        boolean wasKicked = kicked.getOrDefault(meeting.id(), Set.of()).contains(currentUserId);
        boolean autoAdmit = isHost || (!meeting.waitingRoomEnabled() && !wasKicked);
        WaitingGuest guest = registry.putIfAbsent(meeting.id(), currentUserId, user.displayName(), isHost, autoAdmit);

        if (autoAdmit && guest.getAccessToken() == null) {
            guest.admit(generateToken(meeting.id(), meeting.publicId(), currentUserId, user.displayName(), isHost));
        }

        return toStatusResponse(guest, meeting);
    }

    public RoomStatusResponse getStatus(UUID meetingId, UUID currentUserId) {
        MeetingAccess meeting = meetingApi.findById(meetingId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "meeting_not_found", "Заняття не знайдено"));
        WaitingGuest guest = registry.find(meetingId, currentUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "not_in_waiting_room",
                        "Спершу приєднайтесь через /api/rooms/join"));
        return toStatusResponse(guest, meeting);
    }

    public List<WaitingGuestResponse> listWaiting(UUID meetingId, UUID currentUserId) {
        assertHost(meetingId, currentUserId);
        return registry.listWaiting(meetingId).stream()
                .map(g -> new WaitingGuestResponse(g.getUserId(), g.getDisplayName(), g.getRequestedAt()))
                .toList();
    }

    public void admit(UUID meetingId, UUID currentUserId, UUID guestUserId) {
        String publicId = assertHost(meetingId, currentUserId);
        WaitingGuest guest = registry.find(meetingId, guestUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "guest_not_found", "Гостя не знайдено"));
        guest.admit(generateToken(meetingId, publicId, guestUserId, guest.getDisplayName(), guest.isHost()));
        Set<UUID> k = kicked.get(meetingId);
        if (k != null) k.remove(guestUserId);
    }

    /** Змінює кімнату очікування під час проведення; діє на тих, хто заходитиме далі. */
    public void setWaitingRoom(UUID meetingId, UUID currentUserId, boolean enabled) {
        assertHost(meetingId, currentUserId);
        meetingApi.setWaitingRoomEnabled(meetingId, enabled);
    }

    public void deny(UUID meetingId, UUID currentUserId, UUID guestUserId) {
        assertHost(meetingId, currentUserId);
        registry.find(meetingId, guestUserId).ifPresent(WaitingGuest::deny);
    }

    public void kick(UUID meetingId, UUID currentUserId, UUID targetUserId) {
        String publicId = assertHost(meetingId, currentUserId);
        adminClient.removeParticipant(publicId, targetUserId.toString());
        // Прибираємо зі свого реєстру: наступний вхід створить свіжий запит, який побачить організатор.
        registry.remove(meetingId, targetUserId);
        screenShareRequests.resolve(meetingId, targetUserId);
        kicked.computeIfAbsent(meetingId, id -> ConcurrentHashMap.newKeySet()).add(targetUserId);
    }

    public void muteAll(UUID meetingId, UUID currentUserId) {
        String publicId = assertHost(meetingId, currentUserId);
        // Самого організатора, що натиснув кнопку, глушити не потрібно.
        mutedMeetings.add(meetingId);
        adminClient.muteAllAudio(publicId, currentUserId.toString());
    }

    /**
     * Поки в занятті діє «Заглушити всіх», раз на ~1.5 с повторно глушимо тих, хто встиг
     * розглушитись: LiveKit перевіряє право на мікрофон лише при новій публікації треку,
     * тож самої заборони недостатньо — див. LiveKitAdminClient.enforceAudioMuted.
     */
    @Scheduled(fixedDelay = 1500)
    void enforceMutedMeetings() {
        for (UUID meetingId : mutedMeetings) {
            try {
                var meeting = meetingApi.findById(meetingId);
                if (meeting.isEmpty()) {
                    mutedMeetings.remove(meetingId);
                    emptyTicks.remove(meetingId);
                    continue;
                }
                int inRoom = adminClient.enforceAudioMuted(
                        meeting.get().publicId(), meeting.get().hostUserId().toString());
                if (inRoom == 0) {
                    if (emptyTicks.merge(meetingId, 1, Integer::sum) >= EMPTY_TICKS_TO_RESET) {
                        mutedMeetings.remove(meetingId);
                        emptyTicks.remove(meetingId);
                    }
                } else {
                    emptyTicks.remove(meetingId);
                }
            } catch (RuntimeException e) {
                // Тимчасова помилка LiveKit не повинна зупиняти таймер — спробуємо на наступному тіку.
            }
        }
    }

    public void unmuteAll(UUID meetingId, UUID currentUserId) {
        String publicId = assertHost(meetingId, currentUserId);
        mutedMeetings.remove(meetingId);
        emptyTicks.remove(meetingId);
        adminClient.unmuteAllAudio(publicId, currentUserId.toString());
    }

    /**
     * Фото всіх допущених учасників кімнати, для заглушки камери в інших людей
     * (а не лише в себе). userId тут = LiveKit identity (RoomService.generateToken
     * ставить token.setIdentity(userId.toString())), тому фронтенд легко зіставляє
     * Participant.identity з цим списком.
     */
    public List<ParticipantPhotoResponse> listParticipantPhotos(UUID meetingId, UUID currentUserId) {
        registry.find(meetingId, currentUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "not_in_waiting_room",
                        "Спершу приєднайтесь через /api/rooms/join"));
        return registry.listAdmitted(meetingId).stream()
                .map(guest -> new ParticipantPhotoResponse(guest.getUserId(),
                        userApi.findPhotoUrl(guest.getUserId()).orElse(null)))
                .toList();
    }

    public InviteResponse getInvite(UUID meetingId, UUID currentUserId) {
        registry.find(meetingId, currentUserId)
                .filter(g -> g.getStatus() == GuestStatus.ADMITTED)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "not_in_room", "Ви не в конференції"));
        MeetingAccess meeting = meetingApi.findById(meetingId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "meeting_not_found", "Заняття не знайдено"));
        return new InviteResponse(meeting.publicId(), meeting.password());
    }

    public void leave(UUID meetingId, UUID currentUserId) {
        // Гість сам відмовляється чекати на допуск — просто прибираємо його з реєстру.
        registry.remove(meetingId, currentUserId);
    }

    public void endForAll(UUID meetingId, UUID currentUserId) {
        String publicId = assertHost(meetingId, currentUserId);
        adminClient.deleteRoom(publicId);
        registry.clear(meetingId);
        screenShareRequests.clear(meetingId);
        mutedMeetings.remove(meetingId);
        emptyTicks.remove(meetingId);
        kicked.remove(meetingId);
    }

    // ---- демонстрація екрана "за дозволом організатора" ----

    public void requestScreenShare(UUID meetingId, UUID currentUserId) {
        // Переконуємось, що людина справді в кімнаті (без цього немає сенсу в запиті).
        registry.find(meetingId, currentUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "not_in_waiting_room",
                        "Спершу приєднайтесь через /api/rooms/join"));
        screenShareRequests.request(meetingId, currentUserId);
    }

    public List<ScreenShareRequestResponse> listScreenShareRequests(UUID meetingId, UUID currentUserId) {
        assertHost(meetingId, currentUserId);
        return screenShareRequests.listPending(meetingId).stream()
                .flatMap(userId -> userApi.findById(userId).stream())
                .map(user -> new ScreenShareRequestResponse(user.id(), user.displayName()))
                .toList();
    }

    public void approveScreenShare(UUID meetingId, UUID currentUserId, UUID targetUserId) {
        String publicId = assertHost(meetingId, currentUserId);
        screenShareRequests.resolve(meetingId, targetUserId);
        adminClient.allowScreenShare(publicId, targetUserId.toString());
    }

    public void denyScreenShareRequest(UUID meetingId, UUID currentUserId, UUID targetUserId) {
        assertHost(meetingId, currentUserId);
        screenShareRequests.resolve(meetingId, targetUserId);
    }

    // ---- допоміжні методи ----

    private static boolean isHostUser(MeetingAccess meeting, UUID userId) {
        return meeting.hostUserId().equals(userId);
    }

    private String assertHost(UUID meetingId, UUID currentUserId) {
        MeetingAccess meeting = meetingApi.findById(meetingId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "meeting_not_found", "Заняття не знайдено"));
        if (!meeting.hostUserId().equals(currentUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "not_meeting_host",
                    "Лише організатор може керувати кімнатою очікування");
        }
        return meeting.publicId();
    }

    private RoomStatusResponse toStatusResponse(WaitingGuest guest, MeetingAccess meeting) {
        String serverUrl = guest.getStatus() == GuestStatus.ADMITTED ? properties.url() : null;
        return new RoomStatusResponse(meeting.id(), guest.getStatus().name(), guest.getAccessToken(), serverUrl,
                meeting.publicId(), guest.isHost(), meeting.title(), meeting.waitingRoomEnabled());
    }

    // Без явних canPublish/canSubscribe: LiveKit сам дозволяє обидва,
    // якщо жоден з них не вказано явно — документована поведінка SDK.
    //
    // Для учасника (не організатора) одразу обмежуємо джерела публікації до камери й
    // мікрофона — демонстрацію екрана він отримає пізніше, окремо, через updateParticipant,
    // після запиту й схвалення організатором (requestScreenShare/approveScreenShare).
    //
    // CanPublishSources приймає рядкові назви джерел (як у JSON-грантах LiveKit:
    // "camera"/"microphone"/"screen_share"/"screen_share_audio"), а не protobuf-enum
    // LivekitModels.TrackSource — підтверджено помилкою компілятора на попередньому варіанті.
    private String generateToken(UUID meetingId, String roomName, UUID userId, String displayName, boolean isHost) {
        AccessToken token = new AccessToken(properties.apiKey(), properties.apiSecret());
        token.setIdentity(userId.toString());
        token.setName(displayName);
        token.addGrants(new RoomJoin(true), new RoomName(roomName));
        // Без цього гранту LiveKit мовчки відхиляє localParticipant.setAttributes() —
        // саме тому кнопка "Підняти руку" (яка зберігає стан через participant attribute
        // handRaised) ніяк не реагувала: запит на сервер ішов, але сервер його ігнорував.
        token.addGrants(new CanUpdateOwnMetadata(true));
        if (!isHost) {
            // Якщо в занятті зараз діє «Заглушити всіх» — мікрофон гостю не даємо.
            boolean micAllowed = !mutedMeetings.contains(meetingId);
            token.addGrants(new CanPublishSources(micAllowed ? List.of("camera", "microphone") : List.of("camera")));
        }
        return token.toJwt();
    }
}
