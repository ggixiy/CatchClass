package com.catchclass.room.internal.waiting;

import java.time.Instant;
import java.util.UUID;

public class WaitingGuest {

    private final UUID userId;
    private final String displayName;
    private final boolean host;
    private final Instant requestedAt;
    private volatile GuestStatus status;
    private volatile String accessToken; // заповнюється лише після admit()

    public WaitingGuest(UUID userId, String displayName, boolean host, GuestStatus status) {
        this.userId = userId;
        this.displayName = displayName;
        this.host = host;
        this.status = status;
        this.requestedAt = Instant.now();
    }

    public void admit(String accessToken) {
        this.status = GuestStatus.ADMITTED;
        this.accessToken = accessToken;
    }

    public void deny() {
        this.status = GuestStatus.DENIED;
    }

    public UUID getUserId() { return userId; }
    public String getDisplayName() { return displayName; }
    public boolean isHost() { return host; }
    public Instant getRequestedAt() { return requestedAt; }
    public GuestStatus getStatus() { return status; }
    public String getAccessToken() { return accessToken; }
}