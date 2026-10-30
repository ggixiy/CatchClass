package com.catchclass.meeting.internal.service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catchclass.meeting.MeetingAccess;
import com.catchclass.meeting.MeetingApi;
import com.catchclass.meeting.internal.dto.CreateMeetingRequest;
import com.catchclass.meeting.internal.dto.MeetingOccurrenceResponse;
import com.catchclass.meeting.internal.dto.MeetingResponse;
import com.catchclass.meeting.internal.dto.UpdateMeetingRequest;
import com.catchclass.meeting.internal.entity.Meeting;
import com.catchclass.meeting.internal.entity.RecurrenceRule;
import com.catchclass.meeting.internal.repository.MeetingRepository;
import com.catchclass.shared.web.ApiException;

@Service
public class MeetingService implements MeetingApi {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // без O/0 та I/1 — легше прочитати

    private final MeetingRepository repository;

    public MeetingService(MeetingRepository repository) {
        this.repository = repository;
    }

    // ---- публічний контракт MeetingApi ----

    @Override
    @Transactional(readOnly = true)
    public Optional<MeetingAccess> findByPublicId(String publicId) {
        return repository.findByPublicId(publicId).map(this::toAccess);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<MeetingAccess> findById(UUID id) {
        return repository.findById(id).map(this::toAccess);
    }

    @Override
    @Transactional
    public void setWaitingRoomEnabled(UUID id, boolean enabled) {
        repository.findById(id).ifPresent(m -> m.changeWaitingRoom(enabled));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<MeetingAccess> checkAccess(String publicId, String password) {
        return repository.findByPublicId(publicId)
                .filter(m -> m.getPassword() == null || m.getPassword().equals(password))
                .map(this::toAccess);
    }

    // ---- для MeetingController ----

    @Transactional
    public MeetingResponse create(UUID hostUserId, CreateMeetingRequest request) {
        assertNoConflict(hostUserId, request.startTime(), request.durationMinutes(), request.recurrence(),
                request.recurrenceEndsAt(), null);

        String password = resolvePassword(request.requirePassword(), request.password());
        Meeting meeting = new Meeting(UUID.randomUUID(), generateUniquePublicId(), password, hostUserId,
                request.title(), request.description(), request.startTime(), request.durationMinutes(),
                request.recurrence(), request.recurrenceEndsAt(), request.waitingRoomEnabled(), false);
        repository.save(meeting);
        return toResponse(meeting);
    }

    /**
     * "New meeting": миттєвий запуск без форми — найлегший спосіб швидко зібратися.
     * Навмисно без кімнати очікування (усі заходять одразу) і без сліду в календарі.
     */
    @Transactional
    public MeetingResponse createInstant(UUID hostUserId, String title) {
        Meeting meeting = new Meeting(UUID.randomUUID(), generateUniquePublicId(), null, hostUserId,
                title, null, Instant.now(), 60, RecurrenceRule.NONE, null, false, true);
        repository.save(meeting);
        return toResponse(meeting);
    }

    @Transactional(readOnly = true)
    public MeetingResponse getOwn(UUID id, UUID currentUserId) {
        return toResponse(getOwnedOrThrow(id, currentUserId));
    }

    @Transactional
    public MeetingResponse update(UUID id, UUID currentUserId, UpdateMeetingRequest request) {
        Meeting meeting = getOwnedOrThrow(id, currentUserId);
        assertNoConflict(currentUserId, request.startTime(), request.durationMinutes(), request.recurrence(),
                request.recurrenceEndsAt(), id);
        String password = resolvePassword(request.requirePassword(), request.password());
        meeting.update(request.title(), request.description(), request.startTime(), request.durationMinutes(),
                request.recurrence(), request.recurrenceEndsAt(), password, request.waitingRoomEnabled());
        return toResponse(meeting);
    }

    @Transactional
    public void delete(UUID id, UUID currentUserId) {
        repository.delete(getOwnedOrThrow(id, currentUserId));
    }

    /** Розгортає всі заняття користувача-хоста на конкретні проведення в межах [from, to]. */
    @Transactional(readOnly = true)
    public List<MeetingOccurrenceResponse> listOccurrences(UUID hostUserId, Instant from, Instant to) {
        return repository.findByHostUserId(hostUserId).stream()
                .filter(meeting -> !meeting.isInstant())
                .flatMap(meeting -> MeetingOccurrenceExpander
                        .expand(meeting.getStartTime(), meeting.getDurationMinutes(), meeting.getRecurrenceRule(),
                                meeting.getRecurrenceEndsAt(), from, to)
                        .stream()
                        .map(occ -> new MeetingOccurrenceResponse(meeting.getId(), meeting.getPublicId(),
                                meeting.getTitle(), occ.start(), occ.end(), meeting.getRecurrenceRule() != RecurrenceRule.NONE)))
                .sorted((a, b) -> a.startTime().compareTo(b.startTime()))
                .toList();
    }

    // ---- допоміжні методи ----

    private Meeting getOwnedOrThrow(UUID id, UUID currentUserId) {
        Meeting meeting = repository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "meeting_not_found", "Заняття не знайдено"));
        if (!meeting.getHostUserId().equals(currentUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "not_meeting_host", "Це не ваше заняття");
        }
        return meeting;
    }

    /**
     * Перевіряє, чи не перетинається нове/змінене заняття з іншими заняттями того самого
     * організатора. Розгортає обидва правила повторюваності у спільному діапазоні й порівнює
     * проведення попарно. excludeMeetingId — щоб заняття не конфліктувало саме з собою при редагуванні.
     */
    private void assertNoConflict(UUID hostUserId, Instant start, int durationMinutes, RecurrenceRule rule,
                                  Instant recurrenceEndsAt, UUID excludeMeetingId) {
        Instant windowFrom = start;
        Instant windowTo = recurrenceEndsAt != null ? recurrenceEndsAt : start.plus(Duration.ofDays(730));

        List<MeetingOccurrenceExpander.Occurrence> candidate =
                MeetingOccurrenceExpander.expand(start, durationMinutes, rule, recurrenceEndsAt, windowFrom, windowTo);

        for (Meeting other : repository.findByHostUserId(hostUserId)) {
            if (other.getId().equals(excludeMeetingId) || other.isInstant()) {
                continue;
            }
            List<MeetingOccurrenceExpander.Occurrence> otherOccurrences = MeetingOccurrenceExpander.expand(
                    other.getStartTime(), other.getDurationMinutes(), other.getRecurrenceRule(),
                    other.getRecurrenceEndsAt(), windowFrom, windowTo);

            for (var a : candidate) {
                for (var b : otherOccurrences) {
                    if (a.start().isBefore(b.end()) && b.start().isBefore(a.end())) {
                        throw new ApiException(HttpStatus.CONFLICT, "schedule_conflict",
                                "У вас уже є заняття «" + other.getTitle() + "» на цей час");
                    }
                }
            }
        }
    }

    private String generateUniquePublicId() {
        // 9 цифр ≈ мільярд варіантів — зіткнення вкрай малоймовірне, але на випадок
        // одночасного створення двома людьми є страхувальний UNIQUE у БД і повтор спроби.
        for (int attempt = 0; attempt < 5; attempt++) {
            String candidate = generatePublicId();
            if (repository.findByPublicId(candidate).isEmpty()) {
                return candidate;
            }
        }
        throw new IllegalStateException("Не вдалося згенерувати унікальний Meeting ID");
    }

    private String generatePublicId() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 9; i++) {
            sb.append(RANDOM.nextInt(10));
        }
        return sb.toString();
    }

    private String generatePassword() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            sb.append(PASSWORD_ALPHABET.charAt(RANDOM.nextInt(PASSWORD_ALPHABET.length())));
        }
        return sb.toString();
    }

    // Якщо пароль не потрібен — зберігаємо null (вхід без пароля, це вже підтримує checkAccess).
    // Якщо потрібен — вимагаємо непорожній пароль; порожній при увімкненому чекбоксі вважаємо помилкою форми.
    private String resolvePassword(boolean requirePassword, String providedPassword) {
        if (!requirePassword) {
            return null;
        }
        if (providedPassword == null || providedPassword.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "password_required",
                    "Вкажіть пароль або вимкніть вимогу пароля");
        }
        return providedPassword;
    }

    private MeetingAccess toAccess(Meeting meeting) {
        return new MeetingAccess(meeting.getId(), meeting.getPublicId(), meeting.getTitle(), meeting.getHostUserId(),
                meeting.isWaitingRoomEnabled(), meeting.getPassword());
    }

    private MeetingResponse toResponse(Meeting meeting) {
        return new MeetingResponse(meeting.getId(), meeting.getPublicId(), meeting.getPassword(), meeting.getTitle(),
                meeting.getDescription(), meeting.getStartTime(), meeting.getDurationMinutes(),
                meeting.getRecurrenceRule(), meeting.getRecurrenceEndsAt(), meeting.isWaitingRoomEnabled());
    }
}