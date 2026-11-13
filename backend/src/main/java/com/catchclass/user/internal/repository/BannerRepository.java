package com.catchclass.user.internal.repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.catchclass.user.internal.entity.Banner;

public interface BannerRepository extends JpaRepository<Banner, UUID> {

    @Modifying
    @Query("delete from Banner b where b.userId = :userId")
    int deleteByUserIdIfExists(UUID userId);

    // Лише час оновлення — щоб не читати зображення (bytea) заради побудови посилання.
    @Query("select b.updatedAt from Banner b where b.userId = :userId")
    Optional<Instant> findUpdatedAt(UUID userId);
}
