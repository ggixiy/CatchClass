package com.catchclass.course.internal.service;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catchclass.course.CourseApi;
import com.catchclass.course.CourseDeleted;
import com.catchclass.course.CourseSummary;
import com.catchclass.course.internal.dto.CourseMemberResponse;
import com.catchclass.course.internal.dto.CourseRequest;
import com.catchclass.course.internal.dto.CourseResponse;
import com.catchclass.course.internal.entity.Course;
import com.catchclass.course.internal.entity.CourseMember;
import com.catchclass.course.internal.repository.CourseMemberRepository;
import com.catchclass.course.internal.repository.CourseRepository;
import com.catchclass.shared.web.ApiException;
import com.catchclass.user.UserApi;
import com.catchclass.user.UserSummary;

@Service
public class CourseService implements CourseApi {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // без O/0 та I/1
    private static final int CODE_LENGTH = 8;

    private final CourseRepository courses;
    private final CourseMemberRepository members;
    private final UserApi userApi;
    private final ApplicationEventPublisher events;

    public CourseService(CourseRepository courses, CourseMemberRepository members, UserApi userApi,
                         ApplicationEventPublisher events) {
        this.courses = courses;
        this.members = members;
        this.userApi = userApi;
        this.events = events;
    }

    // ---- публічний контракт CourseApi ----

    @Override
    @Transactional(readOnly = true)
    public Optional<CourseSummary> findById(UUID courseId) {
        return courses.findById(courseId).map(c -> new CourseSummary(c.getId(), c.getTitle(), c.getOwnerUserId()));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isMemberOrOwner(UUID courseId, UUID userId) {
        return isOwner(courseId, userId) || members.existsByCourseIdAndUserId(courseId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isOwner(UUID courseId, UUID userId) {
        return courses.findById(courseId).map(c -> c.getOwnerUserId().equals(userId)).orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseSummary> findOwnedBy(UUID userId) {
        return courses.findByOwnerUserId(userId).stream()
                .map(c -> new CourseSummary(c.getId(), c.getTitle(), c.getOwnerUserId())).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UUID> findMemberUserIds(UUID courseId) {
        return members.findByCourseId(courseId).stream().map(CourseMember::getUserId).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UUID> findCourseIdsForUser(UUID userId) {
        Set<UUID> ids = new LinkedHashSet<>();
        courses.findByOwnerUserId(userId).forEach(c -> ids.add(c.getId()));
        members.findByUserId(userId).forEach(m -> ids.add(m.getCourseId()));
        return new ArrayList<>(ids);
    }

    // ---- для CourseController ----

    @Transactional
    public CourseResponse create(UUID ownerId, CourseRequest request) {
        Course course = new Course(UUID.randomUUID(), request.title().trim(), blankToNull(request.description()),
                ownerId, generateUniqueCode());
        courses.save(course);
        return toResponse(course, ownerId);
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> listMine(UUID userId) {
        return courses.findAllById(findCourseIdsForUser(userId)).stream()
                .sorted((a, b) -> a.getTitle().compareToIgnoreCase(b.getTitle()))
                .map(c -> toResponse(c, userId))
                .toList();
    }

    @Transactional(readOnly = true)
    public CourseResponse get(UUID courseId, UUID userId) {
        Course course = getOrThrow(courseId);
        assertAccess(course, userId);
        return toResponse(course, userId);
    }

    @Transactional
    public CourseResponse update(UUID courseId, UUID userId, CourseRequest request) {
        Course course = getOwnedOrThrow(courseId, userId);
        course.update(request.title().trim(), blankToNull(request.description()));
        return toResponse(course, userId);
    }

    @Transactional
    public CourseResponse regenerateCode(UUID courseId, UUID userId) {
        Course course = getOwnedOrThrow(courseId, userId);
        course.changeInviteCode(generateUniqueCode());
        return toResponse(course, userId);
    }

    @Transactional
    public void delete(UUID courseId, UUID userId) {
        Course course = getOwnedOrThrow(courseId, userId);
        courses.delete(course);
        // Заняття курсу видаляє модуль meeting, слухаючи цю подію.
        events.publishEvent(new CourseDeleted(courseId));
    }

    @Transactional
    public CourseResponse join(UUID userId, String code) {
        Course course = courses.findByInviteCode(code.trim().toUpperCase())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "invalid_invite_code",
                        "Курс із таким кодом не знайдено"));
        if (!course.getOwnerUserId().equals(userId) && !members.existsByCourseIdAndUserId(course.getId(), userId)) {
            members.save(new CourseMember(course.getId(), userId));
        }
        return toResponse(course, userId);
    }

    @Transactional(readOnly = true)
    public List<CourseMemberResponse> listMembers(UUID courseId, UUID userId) {
        Course course = getOrThrow(courseId);
        assertAccess(course, userId);
        List<CourseMemberResponse> result = new ArrayList<>();
        result.add(toMemberResponse(course.getOwnerUserId(), course.getCreatedAt(), true));
        members.findByCourseId(courseId).forEach(m -> result.add(toMemberResponse(m.getUserId(), m.getJoinedAt(), false)));
        return result;
    }

    /** Викладач вилучає студента, а студент може вийти з курсу сам (targetUserId = він сам). */
    @Transactional
    public void removeMember(UUID courseId, UUID currentUserId, UUID targetUserId) {
        Course course = getOrThrow(courseId);
        boolean self = currentUserId.equals(targetUserId);
        if (!self && !course.getOwnerUserId().equals(currentUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "not_course_owner", "Лише викладач курсу може вилучати учасників");
        }
        if (targetUserId.equals(course.getOwnerUserId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "owner_cannot_leave",
                    "Викладач не може вийти зі свого курсу — видаліть курс");
        }
        members.deleteByCourseIdAndUserId(courseId, targetUserId);
    }

    // ---- допоміжні методи ----

    private Course getOrThrow(UUID courseId) {
        return courses.findById(courseId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "course_not_found", "Курс не знайдено"));
    }

    private Course getOwnedOrThrow(UUID courseId, UUID userId) {
        Course course = getOrThrow(courseId);
        if (!course.getOwnerUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "not_course_owner", "Це не ваш курс");
        }
        return course;
    }

    private void assertAccess(Course course, UUID userId) {
        if (!course.getOwnerUserId().equals(userId) && !members.existsByCourseIdAndUserId(course.getId(), userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "not_course_member", "Ви не учасник цього курсу");
        }
    }

    private CourseResponse toResponse(Course course, UUID viewerId) {
        boolean owner = course.getOwnerUserId().equals(viewerId);
        String ownerName = userApi.findById(course.getOwnerUserId()).map(UserSummary::displayName).orElse("");
        return new CourseResponse(course.getId(), course.getTitle(), course.getDescription(), course.getOwnerUserId(),
                ownerName, owner, owner ? course.getInviteCode() : null,
                members.countByCourseId(course.getId()), course.getCreatedAt());
    }

    private CourseMemberResponse toMemberResponse(UUID userId, java.time.Instant joinedAt, boolean owner) {
        UserSummary user = userApi.findById(userId).orElse(null);
        return new CourseMemberResponse(userId, user != null ? user.displayName() : "", user != null ? user.email() : "",
                userApi.findPhotoUrl(userId).orElse(null), joinedAt, owner);
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < CODE_LENGTH; i++) {
                sb.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
            }
            if (courses.findByInviteCode(sb.toString()).isEmpty()) {
                return sb.toString();
            }
        }
        throw new IllegalStateException("Не вдалося згенерувати код запрошення");
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
