package com.catchclass.room.internal.controller;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.catchclass.room.internal.dto.JoinRoomRequest;
import com.catchclass.room.internal.dto.InviteResponse;
import com.catchclass.room.internal.dto.ParticipantPhotoResponse;
import com.catchclass.room.internal.dto.RoomStatusResponse;
import com.catchclass.room.internal.dto.ScreenShareRequestResponse;
import com.catchclass.room.internal.dto.WaitingGuestResponse;
import com.catchclass.room.internal.service.RoomService;
import com.catchclass.shared.security.CurrentUser;

@RestController
@RequestMapping("/api/rooms")
class RoomController {

    private final RoomService roomService;

    RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping("/join")
    RoomStatusResponse join(@Valid @RequestBody JoinRoomRequest request) {
        return roomService.join(CurrentUser.require().id(), request.publicId(), request.password());
    }

    // meetingId тут — внутрішній id заняття, отриманий із відповіді /join.
    @GetMapping("/{meetingId}/status")
    RoomStatusResponse status(@PathVariable UUID meetingId) {
        return roomService.getStatus(meetingId, CurrentUser.require().id());
    }

    // Дані для посилання-запрошення: Meeting ID і пароль (null, якщо пароля немає).
    @GetMapping("/{meetingId}/invite")
    InviteResponse invite(@PathVariable UUID meetingId) {
        return roomService.getInvite(meetingId, CurrentUser.require().id());
    }

    // Фото всіх допущених учасників — щоб заглушка вимкненої камери показувала
    // фото кожного, а не лише своє власне.
    @GetMapping("/{meetingId}/participants/photos")
    List<ParticipantPhotoResponse> participantPhotos(@PathVariable UUID meetingId) {
        return roomService.listParticipantPhotos(meetingId, CurrentUser.require().id());
    }

    @GetMapping("/{meetingId}/waiting")
    List<WaitingGuestResponse> waiting(@PathVariable UUID meetingId) {
        return roomService.listWaiting(meetingId, CurrentUser.require().id());
    }

    @PostMapping("/{meetingId}/admit/{guestUserId}")
    void admit(@PathVariable UUID meetingId, @PathVariable UUID guestUserId) {
        roomService.admit(meetingId, CurrentUser.require().id(), guestUserId);
    }

    @PostMapping("/{meetingId}/deny/{guestUserId}")
    void deny(@PathVariable UUID meetingId, @PathVariable UUID guestUserId) {
        roomService.deny(meetingId, CurrentUser.require().id(), guestUserId);
    }

    @PostMapping("/{meetingId}/kick/{targetUserId}")
    void kick(@PathVariable UUID meetingId, @PathVariable UUID targetUserId) {
        roomService.kick(meetingId, CurrentUser.require().id(), targetUserId);
    }

    @PostMapping("/{meetingId}/waiting-room")
    void setWaitingRoom(@PathVariable UUID meetingId, @RequestParam boolean enabled) {
        roomService.setWaitingRoom(meetingId, CurrentUser.require().id(), enabled);
    }

    @PostMapping("/{meetingId}/presence")
    void presence(@PathVariable UUID meetingId) {
        roomService.presence(meetingId, CurrentUser.require().id());
    }

    @PostMapping("/{meetingId}/presence/leave")
    void presenceLeave(@PathVariable UUID meetingId) {
        roomService.presenceLeave(meetingId, CurrentUser.require().id());
    }

    @PostMapping("/{meetingId}/mute-all")
    void muteAll(@PathVariable UUID meetingId) {
        roomService.muteAll(meetingId, CurrentUser.require().id());
    }

    @PostMapping("/{meetingId}/unmute-all")
    void unmuteAll(@PathVariable UUID meetingId) {
        roomService.unmuteAll(meetingId, CurrentUser.require().id());
    }

    @PostMapping("/{meetingId}/leave")
    void leave(@PathVariable UUID meetingId) {
        roomService.leave(meetingId, CurrentUser.require().id());
    }

    @PostMapping("/{meetingId}/end")
    void end(@PathVariable UUID meetingId) {
        roomService.endForAll(meetingId, CurrentUser.require().id());
    }

    // ---- демонстрація екрана "за дозволом організатора" ----

    @PostMapping("/{meetingId}/screen-share/request")
    void requestScreenShare(@PathVariable UUID meetingId) {
        roomService.requestScreenShare(meetingId, CurrentUser.require().id());
    }

    @GetMapping("/{meetingId}/screen-share/requests")
    List<ScreenShareRequestResponse> screenShareRequests(@PathVariable UUID meetingId) {
        return roomService.listScreenShareRequests(meetingId, CurrentUser.require().id());
    }

    @PostMapping("/{meetingId}/screen-share/approve/{targetUserId}")
    void approveScreenShare(@PathVariable UUID meetingId, @PathVariable UUID targetUserId) {
        roomService.approveScreenShare(meetingId, CurrentUser.require().id(), targetUserId);
    }

    @PostMapping("/{meetingId}/screen-share/deny/{targetUserId}")
    void denyScreenShare(@PathVariable UUID meetingId, @PathVariable UUID targetUserId) {
        roomService.denyScreenShareRequest(meetingId, CurrentUser.require().id(), targetUserId);
    }
}