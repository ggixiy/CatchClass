package com.catchclass.user.internal.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "photos", schema = "users")
public class Photo {

    @Id
    private UUID userId;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(nullable = false)
    private byte[] data;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Photo() {
    }

    public Photo(UUID userId, String contentType, byte[] data) {
        this.userId = userId;
        this.contentType = contentType;
        this.data = data;
        this.updatedAt = Instant.now();
    }

    public void replace(String contentType, byte[] data) {
        this.contentType = contentType;
        this.data = data;
        this.updatedAt = Instant.now();
    }

    public String getContentType() { return contentType; }
    public byte[] getData() { return data; }
}