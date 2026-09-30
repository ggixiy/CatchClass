package com.catchclass.auth.internal.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "credentials", schema = "auth")
public class Credential {

    @Id
    private UUID userId;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Credential() {
    }

    public Credential(UUID userId, String passwordHash) {
        this.userId = userId;
        this.passwordHash = passwordHash;
        this.createdAt = Instant.now();
    }

    public UUID getUserId() { return userId; }
    public String getPasswordHash() { return passwordHash; }
    public boolean isEmailVerified() { return emailVerified; }

    public void markEmailVerified() {
        this.emailVerified = true;
    }

    public void changePassword(String newPasswordHash) {
        this.passwordHash = newPasswordHash;
    }
}