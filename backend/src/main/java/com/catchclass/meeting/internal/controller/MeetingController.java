package com.catchclass.meeting.internal.controller;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.catchclass.meeting.internal.dto.CreateMeetingRequest;
import com.catchclass.meeting.internal.dto.MeetingOccurrenceResponse;
import com.catchclass.meeting.internal.dto.MeetingResponse;
import com.catchclass.meeting.internal.dto.UpdateMeetingRequest;
import com.catchclass.meeting.internal.service.MeetingService;
import com.catchclass.shared.security.CurrentUser;

@RestController
@RequestMapping("/api/meetings")
class MeetingController {

    private final MeetingService meetingService;

    MeetingController(MeetingService meetingService) {
        this.meetingService = meetingService;
    }

    @PostMapping
    ResponseEntity<MeetingResponse> create(@Valid @RequestBody CreateMeetingRequest request) {
        MeetingResponse response = meetingService.create(CurrentUser.require().id(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/instant")
    ResponseEntity<MeetingResponse> createInstant(@RequestParam(defaultValue = "Нове заняття") String title) {
        MeetingResponse response = meetingService.createInstant(CurrentUser.require().id(), title);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    List<MeetingOccurrenceResponse> list(@RequestParam Instant from, @RequestParam Instant to) {
        return meetingService.listOccurrences(CurrentUser.require().id(), from, to);
    }

    @GetMapping("/course/{courseId}")
    List<MeetingOccurrenceResponse> listForCourse(@PathVariable UUID courseId, @RequestParam Instant from,
                                                   @RequestParam Instant to) {
        return meetingService.listCourseOccurrences(CurrentUser.require().id(), courseId, from, to);
    }

    @GetMapping("/{id}")
    MeetingResponse get(@PathVariable UUID id) {
        return meetingService.getOwn(id, CurrentUser.require().id());
    }

    @PutMapping("/{id}")
    MeetingResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateMeetingRequest request) {
        return meetingService.update(id, CurrentUser.require().id(), request);
    }

    @DeleteMapping("/{id}/occurrences")
    ResponseEntity<Void> deleteOccurrence(@PathVariable UUID id, @RequestParam Instant start) {
        meetingService.deleteOccurrence(id, CurrentUser.require().id(), start);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable UUID id) {
        meetingService.delete(id, CurrentUser.require().id());
        return ResponseEntity.noContent().build();
    }
}