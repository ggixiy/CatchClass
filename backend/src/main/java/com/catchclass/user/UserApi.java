package com.catchclass.user;

import java.util.Optional;
import java.util.UUID;

public interface UserApi {

    UserSummary create(String email, String displayName);

    Optional<UserSummary> findById(UUID id);

    Optional<UserSummary> findByEmail(String email);

    /** URL фото профілю (/api/users/{id}/photo), якщо воно завантажене; інакше порожньо. */
    Optional<String> findPhotoUrl(UUID id);

    /** URL банера профілю (/api/users/{id}/banner?v=...), якщо він завантажений; інакше порожньо. */
    Optional<String> findBannerUrl(UUID id);
}