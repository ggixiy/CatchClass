package com.catchclass.user;

import java.util.Optional;
import java.util.UUID;

public interface UserApi {

    UserSummary create(String email, String displayName);

    Optional<UserSummary> findById(UUID id);

    Optional<UserSummary> findByEmail(String email);
}