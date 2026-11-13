package com.catchclass.analytics.internal.service;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catchclass.analytics.internal.dto.AttendanceJournalResponse;
import com.catchclass.analytics.internal.dto.AttendanceJournalResponse.JournalLesson;
import com.catchclass.analytics.internal.dto.AttendanceJournalResponse.JournalStudent;
import com.catchclass.analytics.internal.dto.TeacherDashboardResponse;
import com.catchclass.analytics.internal.dto.TeacherDashboardResponse.CourseStat;
import com.catchclass.analytics.internal.dto.TeacherDashboardResponse.DashboardLesson;
import com.catchclass.analytics.internal.dto.TeacherDashboardResponse.TopStudent;
import com.catchclass.course.CourseApi;
import com.catchclass.course.CourseSummary;
import com.catchclass.meeting.MeetingApi;
import com.catchclass.meeting.OccurrenceInfo;
import com.catchclass.room.AttendanceRecord;
import com.catchclass.room.RoomApi;
import com.catchclass.shared.web.ApiException;
import com.catchclass.user.UserApi;
import com.catchclass.user.UserSummary;

/**
 * Дашборд викладача й журнал відвідуваності. Нічого не зберігає сам: збирає дані з модулів
 * meeting (розклад), course (студенти) і room (сеанси присутності).
 */
@Service
public class AnalyticsService {

    private static final ZoneId ZONE = ZoneId.of("Europe/Kyiv");
    // Присутність зараховуємо, якщо людина зайшла трохи раніше початку або трохи після кінця заняття.
    private static final Duration BEFORE = Duration.ofMinutes(15);
    private static final Duration AFTER = Duration.ofMinutes(60);
    private static final int STATS_DAYS = 30;
    private static final int JOURNAL_DAYS = 120;
    private static final int TOP_STUDENTS = 5;

    private final MeetingApi meetingApi;
    private final CourseApi courseApi;
    private final RoomApi roomApi;
    private final UserApi userApi;

    public AnalyticsService(MeetingApi meetingApi, CourseApi courseApi, RoomApi roomApi, UserApi userApi) {
        this.meetingApi = meetingApi;
        this.courseApi = courseApi;
        this.roomApi = roomApi;
        this.userApi = userApi;
    }

    @Transactional(readOnly = true)
    public TeacherDashboardResponse teacherDashboard(UUID userId, UUID courseId) {
        Instant now = Instant.now();
        Map<UUID, CourseSummary> owned = new LinkedHashMap<>();
        courseApi.findOwnedBy(userId).forEach(c -> owned.put(c.id(), c));
        if (courseId != null) {
            if (!owned.containsKey(courseId)) {
                throw new ApiException(HttpStatus.FORBIDDEN, "not_course_owner", "Дашборд доступний лише викладачу курсу");
            }
            owned.keySet().retainAll(java.util.Set.of(courseId));
        }
        Map<UUID, List<UUID>> students = new HashMap<>();
        owned.keySet().forEach(id -> students.put(id, courseApi.findMemberUserIds(id)));

        Instant weekStart = LocalDate.now(ZONE).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .atStartOfDay(ZONE).toInstant();
        Instant weekEnd = weekStart.atZone(ZONE).plusDays(7).toInstant();
        Instant statsFrom = now.minus(Duration.ofDays(STATS_DAYS));

        List<OccurrenceInfo> weekOcc = meetingApi.findOccurrences(userId, weekStart, weekEnd).stream()
                .filter(o -> o.own() && (courseId == null || courseId.equals(o.courseId()))).toList();
        List<OccurrenceInfo> pastOcc = meetingApi.findOccurrences(userId, statsFrom, now).stream()
                .filter(o -> o.own() && o.courseId() != null && owned.containsKey(o.courseId()) && o.end().isBefore(now))
                .toList();

        Set<UUID> meetingIds = new HashSet<>();
        weekOcc.forEach(o -> meetingIds.add(o.meetingId()));
        pastOcc.forEach(o -> meetingIds.add(o.meetingId()));
        Instant rangeFrom = statsFrom.minus(BEFORE).isBefore(weekStart.minus(BEFORE)) ? statsFrom.minus(BEFORE) : weekStart.minus(BEFORE);
        List<AttendanceRecord> records = roomApi.findAttendance(meetingIds, rangeFrom, weekEnd.plus(AFTER));

        // тиждень
        List<DashboardLesson> week = new ArrayList<>();
        for (OccurrenceInfo o : weekOcc) {
            String status = o.end().isBefore(now) ? "DONE"
                    : o.start().isAfter(now) && !startedEarly(o, records) ? "UPCOMING" : "LIVE";
            CourseSummary course = o.courseId() != null ? owned.get(o.courseId()) : null;
            Integer attended = null, members = null, percent = null;
            if (course != null && !"UPCOMING".equals(status)) {
                List<UUID> st = students.get(course.id());
                members = st.size();
                attended = minutesByStudent(o, records, st).size();
                percent = members > 0 ? percentOf(attended, members) : null;
            }
            week.add(new DashboardLesson(o.meetingId(), o.publicId(), o.title(), o.courseId(),
                    course != null ? course.title() : null, o.start(), o.end(), status, attended, members, percent));
        }

        // статистика за 30 днів
        Map<UUID, int[]> perCoursePercents = new HashMap<>(); // [сума %, кількість з учасниками]
        Map<UUID, Integer> perCourseLessons = new HashMap<>();
        Map<UUID, Integer> lessonsByStudent = new HashMap<>();
        Map<UUID, Long> minutesByStudent = new HashMap<>();
        int percentSum = 0, percentCount = 0;
        for (OccurrenceInfo o : pastOcc) {
            List<UUID> st = students.get(o.courseId());
            Map<UUID, Long> present = minutesByStudent(o, records, st);
            perCourseLessons.merge(o.courseId(), 1, Integer::sum);
            if (!st.isEmpty()) {
                int p = percentOf(present.size(), st.size());
                percentSum += p;
                percentCount++;
                int[] acc = perCoursePercents.computeIfAbsent(o.courseId(), k -> new int[2]);
                acc[0] += p;
                acc[1]++;
            }
            present.forEach((student, minutes) -> {
                lessonsByStudent.merge(student, 1, Integer::sum);
                minutesByStudent.merge(student, minutes, Long::sum);
            });
        }

        List<TopStudent> top = lessonsByStudent.keySet().stream()
                .sorted(Comparator.<UUID>comparingInt(lessonsByStudent::get).reversed()
                        .thenComparing(Comparator.<UUID>comparingLong(minutesByStudent::get).reversed()))
                .limit(TOP_STUDENTS)
                .map(id -> new TopStudent(id, userApi.findById(id).map(UserSummary::displayName).orElse(""),
                        userApi.findPhotoUrl(id).orElse(null), lessonsByStudent.get(id), minutesByStudent.get(id)))
                .toList();

        List<CourseStat> stats = owned.values().stream().map(c -> {
            int[] acc = perCoursePercents.get(c.id());
            return new CourseStat(c.id(), c.title(), students.get(c.id()).size(),
                    perCourseLessons.getOrDefault(c.id(), 0),
                    acc != null && acc[1] > 0 ? Math.round((float) acc[0] / acc[1]) : null);
        }).toList();

        int studentsTotal = (int) students.values().stream().flatMap(List::stream).distinct().count();
        return new TeacherDashboardResponse(weekStart, weekEnd, week,
                percentCount > 0 ? Math.round((float) percentSum / percentCount) : null,
                pastOcc.size(), studentsTotal, top, stats);
    }

    @Transactional(readOnly = true)
    public AttendanceJournalResponse journal(UUID courseId, UUID userId) {
        if (!courseApi.isOwner(courseId, userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "not_course_owner", "Журнал доступний лише викладачу курсу");
        }
        Instant now = Instant.now();
        List<OccurrenceInfo> lessons = meetingApi
                .findCourseOccurrences(courseId, now.minus(Duration.ofDays(JOURNAL_DAYS)), now.plus(Duration.ofHours(12)))
                .stream().sorted(Comparator.comparing(OccurrenceInfo::start)).toList();
        List<UUID> students = courseApi.findMemberUserIds(courseId);

        Set<UUID> meetingIds = new HashSet<>();
        lessons.forEach(o -> meetingIds.add(o.meetingId()));
        List<AttendanceRecord> records = roomApi.findAttendance(meetingIds,
                now.minus(Duration.ofDays(JOURNAL_DAYS)).minus(BEFORE), now);
        // У журнал потрапляють заняття, що вже почались за розкладом, і ті, які розпочали достроково.
        lessons = lessons.stream().filter(o -> !o.start().isAfter(now) || startedEarly(o, records)).toList();

        List<Map<UUID, Long>> perLesson = lessons.stream().map(o -> minutesByStudent(o, records, students)).toList();
        List<JournalStudent> rows = new ArrayList<>();
        for (UUID student : students) {
            List<Long> minutes = new ArrayList<>();
            int attended = 0;
            for (Map<UUID, Long> m : perLesson) {
                long v = m.getOrDefault(student, 0L);
                minutes.add(v);
                if (v > 0) attended++;
            }
            UserSummary u = userApi.findById(student).orElse(null);
            rows.add(new JournalStudent(student, u != null ? u.displayName() : "", u != null ? u.email() : "", minutes, attended));
        }
        rows.sort(Comparator.comparing(JournalStudent::displayName, String.CASE_INSENSITIVE_ORDER));
        return new AttendanceJournalResponse(
                lessons.stream().map(o -> new JournalLesson(o.meetingId(), o.title(), o.start())).toList(), rows);
    }

    /**
     * Скільки хвилин кожен зі студентів провів на занятті. Сеанс, прив'язаний до проведення при вході
     * (occurrenceStart), рахується за цим заняттям незалежно від того, коли воно фактично почалось.
     * Старі сеанси без прив'язки зіставляються за вікном [початок − 15 хв, кінець + 60 хв].
     * Присутність зараховується, щойно є хоча б один прив'язаний сеанс (мінімум 1 хвилина).
     */
    private Map<UUID, Long> minutesByStudent(OccurrenceInfo o, List<AttendanceRecord> records, List<UUID> students) {
        Instant from = o.start().minus(BEFORE);
        Instant to = o.end().plus(AFTER);
        Set<UUID> allowed = new HashSet<>(students);
        Map<UUID, Long> seconds = new HashMap<>();
        Set<UUID> bound = new HashSet<>();
        for (AttendanceRecord r : records) {
            if (!r.meetingId().equals(o.meetingId()) || !allowed.contains(r.userId())) continue;
            if (r.occurrenceStart() != null) {
                if (!sameInstant(r.occurrenceStart(), o.start())) continue;
                bound.add(r.userId());
                seconds.merge(r.userId(), Math.max(0, Duration.between(r.joinedAt(), r.endedAt()).getSeconds()), Long::sum);
                continue;
            }
            if (r.joinedAt().isBefore(from) || r.joinedAt().isAfter(to)) continue;
            Instant end = r.endedAt().isAfter(to) ? to : r.endedAt();
            long s = Math.max(0, Duration.between(r.joinedAt(), end).getSeconds());
            seconds.merge(r.userId(), s, Long::sum);
        }
        Map<UUID, Long> minutes = new HashMap<>();
        seconds.forEach((id, s) -> {
            long m = Math.round(s / 60.0);
            if (bound.contains(id)) minutes.put(id, Math.max(1, m));
            else if (m >= 1) minutes.put(id, m);
        });
        return minutes;
    }

    // TIMESTAMPTZ у БД зберігає мікросекунди, а Instant розкладу — інший ступінь точності: порівнюємо з точністю до мілісекунд.
    private static boolean sameInstant(Instant a, Instant b) {
        return a.truncatedTo(ChronoUnit.MILLIS).equals(b.truncatedTo(ChronoUnit.MILLIS));
    }

    /** Чи розпочато заняття достроково: є сеанси, прив'язані до його проведення, хоча за розкладом воно ще не почалось. */
    private static boolean startedEarly(OccurrenceInfo o, List<AttendanceRecord> records) {
        return records.stream().anyMatch(r -> r.meetingId().equals(o.meetingId())
                && r.occurrenceStart() != null && sameInstant(r.occurrenceStart(), o.start()));
    }

    private static int percentOf(int part, int total) {
        return Math.round(part * 100f / total);
    }
}
