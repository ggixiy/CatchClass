package com.catchclass.analytics.internal.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TeacherDashboardResponse(
        Instant weekStart, Instant weekEnd,
        List<DashboardLesson> weekLessons,
        Integer averageAttendance, int lessonsHeld, int studentsTotal,
        List<TopStudent> topStudents,
        List<CourseStat> courses
) {

    /** status: UPCOMING | LIVE | DONE; attended/members/percent — лише для проведених занять курсу. */
    public record DashboardLesson(UUID meetingId, String publicId, String title, UUID courseId, String courseTitle,
                                  Instant start, Instant end, String status,
                                  Integer attended, Integer members, Integer percent) {
    }

    public record TopStudent(UUID userId, String displayName, String photoUrl, int lessonsAttended, long minutes) {
    }

    public record CourseStat(UUID courseId, String title, int members, int lessonsHeld, Integer averageAttendance) {
    }
}
