package com.catchclass.course;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Публічний контракт модуля course — для модуля meeting (заняття, що належать курсу). */
public interface CourseApi {

    Optional<CourseSummary> findById(UUID courseId);

    /** true, якщо користувач — викладач курсу або його учасник. */
    boolean isMemberOrOwner(UUID courseId, UUID userId);

    boolean isOwner(UUID courseId, UUID userId);

    /** Усі курси користувача: і створені ним, і ті, до яких він приєднався. */
    List<UUID> findCourseIdsForUser(UUID userId);
}
