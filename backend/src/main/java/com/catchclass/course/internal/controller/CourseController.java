package com.catchclass.course.internal.controller;

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
import org.springframework.web.bind.annotation.RestController;

import com.catchclass.course.internal.dto.CourseMemberResponse;
import com.catchclass.course.internal.dto.CourseRequest;
import com.catchclass.course.internal.dto.CourseResponse;
import com.catchclass.course.internal.dto.JoinCourseRequest;
import com.catchclass.course.internal.service.CourseService;
import com.catchclass.shared.security.CurrentUser;

@RestController
@RequestMapping("/api/courses")
class CourseController {

    private final CourseService courseService;

    CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @PostMapping
    ResponseEntity<CourseResponse> create(@Valid @RequestBody CourseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.create(CurrentUser.require().id(), request));
    }

    @GetMapping
    List<CourseResponse> listMine() {
        return courseService.listMine(CurrentUser.require().id());
    }

    @PostMapping("/join")
    CourseResponse join(@Valid @RequestBody JoinCourseRequest request) {
        return courseService.join(CurrentUser.require().id(), request.code());
    }

    @GetMapping("/{id}")
    CourseResponse get(@PathVariable UUID id) {
        return courseService.get(id, CurrentUser.require().id());
    }

    @PutMapping("/{id}")
    CourseResponse update(@PathVariable UUID id, @Valid @RequestBody CourseRequest request) {
        return courseService.update(id, CurrentUser.require().id(), request);
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable UUID id) {
        courseService.delete(id, CurrentUser.require().id());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/invite-code")
    CourseResponse regenerateCode(@PathVariable UUID id) {
        return courseService.regenerateCode(id, CurrentUser.require().id());
    }

    @GetMapping("/{id}/members")
    List<CourseMemberResponse> members(@PathVariable UUID id) {
        return courseService.listMembers(id, CurrentUser.require().id());
    }

    @DeleteMapping("/{id}/members/{userId}")
    ResponseEntity<Void> removeMember(@PathVariable UUID id, @PathVariable UUID userId) {
        courseService.removeMember(id, CurrentUser.require().id(), userId);
        return ResponseEntity.noContent().build();
    }
}
