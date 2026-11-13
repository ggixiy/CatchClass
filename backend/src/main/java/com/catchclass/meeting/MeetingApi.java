package com.catchclass.meeting;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MeetingApi {

    /** Знаходить заняття за публічним Meeting ID, без перевірки пароля. */
    Optional<MeetingAccess> findByPublicId(String publicId);

    /** Повертає заняття, лише якщо Meeting ID існує й пароль збігається (або пароля не потрібно). */
    Optional<MeetingAccess> checkAccess(String publicId, String password);

    /**
     * Те саме, але учасникам курсу, до якого належить заняття, пароль не потрібен —
     * вони заходять із власного розкладу.
     */
    Optional<MeetingAccess> checkAccess(String publicId, String password, UUID userId);

    Optional<MeetingAccess> findById(UUID id);

    /** Проведення зі розкладу користувача (власні й курсів, де він студент) у проміжку [from, to]. */
    List<OccurrenceInfo> findOccurrences(UUID userId, Instant from, Instant to);

    /** Проведення занять одного курсу у проміжку [from, to]. */
    List<OccurrenceInfo> findCourseOccurrences(UUID courseId, Instant from, Instant to);

    /** Вмикає/вимикає кімнату очікування вже існуючого заняття (під час проведення). */
    void setWaitingRoomEnabled(UUID id, boolean enabled);
}