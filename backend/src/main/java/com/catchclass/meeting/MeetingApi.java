package com.catchclass.meeting;

import java.util.Optional;
import java.util.UUID;

public interface MeetingApi {

    /** Знаходить заняття за публічним Meeting ID, без перевірки пароля. */
    Optional<MeetingAccess> findByPublicId(String publicId);

    /** Повертає заняття, лише якщо Meeting ID існує й пароль збігається (або пароля не потрібно). */
    Optional<MeetingAccess> checkAccess(String publicId, String password);

    Optional<MeetingAccess> findById(UUID id);
}