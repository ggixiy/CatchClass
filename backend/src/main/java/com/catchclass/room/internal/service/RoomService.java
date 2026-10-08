package com.catchclass.room.internal.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.catchclass.room.internal.livekit.LiveKitAdminClient;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.catchclass.meeting.MeetingAccess;
import com.catchclass.meeting.MeetingApi;
import com.catchclass.room.ParticipantInfo;
import com.catchclass.room.RoomApi;
import com.catchclass.room.internal.config.LiveKitProperties;
import com.catchclass.room.internal.dto.RoomStatusResponse;
import com.catchclass.room.internal.dto.WaitingGuestResponse;
import com.catchclass.room.internal.waiting.GuestStatus;
import com.catchclass.room.internal.waiting.WaitingGuest;
import com.catchclass.room.internal.waiting.WaitingRoomRegistry;
import com.catchclass.shared.web.ApiException;
import com.catchclass.user.UserApi;
import com.catchclass.user.UserSummary;

import io.livekit.server.AccessToken;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;

@Service
public class RoomService implements RoomApi {

    private final MeetingApi meetingApi;
    private final UserApi userApi;
    private final WaitingRoomRegistry registry;
    private final LiveKitProperties properties;
    private final LiveKitAdminClient adminClient;

    public RoomService(MeetingApi meetingApi, UserApi userApi, WaitingRoomRegistry registry,
                       LiveKitProperties properties, LiveKitAdminClient adminClient) {
        this.meetingApi = meetingApi;
        this.userApi = userApi;
        this.registry = registry;
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

    /** Організатора допускає миттєво; гостя ставить у чергу очікування. */
    public RoomStatusResponse join(UUID currentUserId, String publicId, String password) {
        MeetingAccess meeting = meetingApi.checkAccess(publicId, password)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "invalid_meeting_credentials",
                        "Неправильний Meeting ID або пароль"));

        UserSummary user = userApi.findById(currentUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "user_not_found", "Користувача не знайдено"));

        boolean isHost = meeting.hostUserId().equals(currentUserId);
        WaitingGuest guest = registry.putIfAbsent(meeting.id(), currentUserId, user.displayName(), isHost);

        if (isHost && guest.getAccessToken() == null) {
            guest.admit(generateToken(meeting.publicId(), currentUserId, user.displayName()));
        }

        return toStatusResponse(meeting.id(), guest, meeting.publicId());
    }

    public RoomStatusResponse getStatus(UUID meetingId, UUID currentUserId) {
        MeetingAccess meeting = meetingApi.findById(meetingId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "meeting_not_found", "Заняття не знайдено"));
        WaitingGuest guest = registry.find(meetingId, currentUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "not_in_waiting_room",
                        "Спершу приєднайтесь через /api/rooms/join"));
        return toStatusResponse(meetingId, guest, meeting.publicId());
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
        guest.admit(generateToken(publicId, guestUserId, guest.getDisplayName()));
    }

    public void deny(UUID meetingId, UUID currentUserId, UUID guestUserId) {
        assertHost(meetingId, currentUserId);
        registry.find(meetingId, guestUserId).ifPresent(WaitingGuest::deny);
    }

    public void kick(UUID meetingId, UUID currentUserId, UUID targetUserId) {
        String publicId = assertHost(meetingId, currentUserId);
        adminClient.removeParticipant(publicId, targetUserId.toString());
        // Приберемо й зі свого реєстру, щоб /status більше не показував "ADMITTED" для цієї людини.
        registry.find(meetingId, targetUserId).ifPresent(WaitingGuest::deny);
    }

    public void muteAll(UUID meetingId, UUID currentUserId) {
        String publicId = assertHost(meetingId, currentUserId);
        adminClient.muteAllAudio(publicId);
    }

    public void endForAll(UUID meetingId, UUID currentUserId) {
        String publicId = assertHost(meetingId, currentUserId);
        adminClient.deleteRoom(publicId);
        registry.clear(meetingId);
    }

    // ---- допоміжні методи ----

    private String assertHost(UUID meetingId, UUID currentUserId) {
        MeetingAccess meeting = meetingApi.findById(meetingId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "meeting_not_found", "Заняття не знайдено"));
        if (!meeting.hostUserId().equals(currentUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "not_meeting_host",
                    "Лише організатор може керувати кімнатою очікування");
        }
        return meeting.publicId();
    }

    private RoomStatusResponse toStatusResponse(UUID meetingId, WaitingGuest guest, String roomName) {
        String serverUrl = guest.getStatus() == GuestStatus.ADMITTED ? properties.url() : null;
        return new RoomStatusResponse(meetingId, guest.getStatus().name(), guest.getAccessToken(), serverUrl, roomName);
    }

    // Без явних canPublish/canSubscribe: LiveKit сам дозволяє обидва,
    // якщо жоден з них не вказано явно — документована поведінка SDK.
    private String generateToken(String roomName, UUID userId, String displayName) {
        AccessToken token = new AccessToken(properties.apiKey(), properties.apiSecret());
        token.setIdentity(userId.toString());
        token.setName(displayName);
        token.addGrants(new RoomJoin(true), new RoomName(roomName));
        return token.toJwt();
    }
}