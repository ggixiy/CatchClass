package com.catchclass.auth.internal.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "action_tokens", schema = "auth")
public class ActionToken {

    public enum Type { EMAIL_VERIFICATION, PASSWORD_RESET }

    @Id
    @Column(name = "token_hash")
    private String tokenHash;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ActionToken() {
    }

    public ActionToken(String tokenHash, UUID userId, Type type, Instant expiresAt) {
        this.tokenHash = tokenHash;
        this.userId = userId;
        this.type = type;
        this.expiresAt = expiresAt;
        this.createdAt = Instant.now();
    }

    public UUID getUserId() { return userId; }
    public Type getType() { return type; }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }
}