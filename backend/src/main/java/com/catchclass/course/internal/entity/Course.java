package com.catchclass.course.internal.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "courses", schema = "courses")
public class Course {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column
    private String description;

    @Column(name = "owner_user_id", nullable = false)
    private UUID ownerUserId;

    @Column(name = "invite_code", nullable = false, unique = true)
    private String inviteCode;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Course() {
    }

    public Course(UUID id, String title, String description, UUID ownerUserId, String inviteCode) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.ownerUserId = ownerUserId;
        this.inviteCode = inviteCode;
        this.createdAt = Instant.now();
    }

    public void update(String title, String description) {
        this.title = title;
        this.description = description;
    }

    public void changeInviteCode(String inviteCode) {
        this.inviteCode = inviteCode;
    }

    public UUID getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public UUID getOwnerUserId() { return ownerUserId; }
    public String getInviteCode() { return inviteCode; }
    public Instant getCreatedAt() { return createdAt; }
}
