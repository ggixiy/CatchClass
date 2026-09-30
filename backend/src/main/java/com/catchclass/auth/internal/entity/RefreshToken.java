package com.catchclass.auth.internal.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "refresh_tokens", schema = "auth")
public class RefreshToken {

    @Id
    @Column(name = "token_hash")
    private String tokenHash; // сам хеш і є первинним ключем — по ньому й шукаємо токен при refresh

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected RefreshToken() {
    }

    public RefreshToken(String tokenHash, UUID userId, Instant expiresAt) {
        this.tokenHash = tokenHash;
        this.userId = userId;
        this.expiresAt = expiresAt;
        this.createdAt = Instant.now();
    }

    public String getTokenHash() { return tokenHash; }
    public UUID getUserId() { return userId; }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }
}