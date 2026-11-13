package com.catchclass.analytics.internal.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.catchclass.analytics.internal.dto.AttendanceJournalResponse;
import com.catchclass.analytics.internal.dto.TeacherDashboardResponse;
import com.catchclass.analytics.internal.service.AnalyticsService;
import com.catchclass.shared.security.CurrentUser;

@RestController
@RequestMapping("/api/analytics")
class AnalyticsController {

    private final AnalyticsService service;

    AnalyticsController(AnalyticsService service) {
        this.service = service;
    }

    @GetMapping("/teacher")
    TeacherDashboardResponse teacher(@RequestParam(required = false) UUID courseId) {
        return service.teacherDashboard(CurrentUser.require().id(), courseId);
    }

    @GetMapping("/courses/{courseId}/attendance")
    AttendanceJournalResponse journal(@PathVariable UUID courseId) {
        return service.journal(courseId, CurrentUser.require().id());
    }
}
