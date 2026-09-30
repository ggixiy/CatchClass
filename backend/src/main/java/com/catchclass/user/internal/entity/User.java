package com.catchclass.user.internal.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "profiles", schema = "users")
public class User {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected User() {
        // для Hibernate
    }

    public User(UUID id, String email, String displayName) {
        this.id = id;
        this.email = email;
        this.displayName = displayName;
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void updateDisplayName(String displayName) {
        this.displayName = displayName;
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public String getDisplayName() { return displayName; }
}