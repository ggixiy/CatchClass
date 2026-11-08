package com.catchclass.meeting;

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

    /** Вмикає/вимикає кімнату очікування вже існуючого заняття (під час проведення). */
    void setWaitingRoomEnabled(UUID id, boolean enabled);
}