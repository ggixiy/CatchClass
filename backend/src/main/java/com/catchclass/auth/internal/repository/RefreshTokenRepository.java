package com.catchclass.auth.internal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.catchclass.auth.internal.entity.RefreshToken;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {

    /**
     * Видаляє токен, якщо він ще існує. На відміну від delete(entity),
     * НЕ кидає виняток, якщо рядка вже нема (наприклад, його щойно "спалив"
     * паралельний запит) — просто повертає 0.
     */
    @Modifying
    @Query("delete from RefreshToken t where t.tokenHash = :hash")
    int deleteByTokenHashIfExists(String hash);
}