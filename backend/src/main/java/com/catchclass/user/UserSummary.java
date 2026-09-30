package com.catchclass.user;

import java.util.UUID;

public record UserSummary(UUID id, String email, String displayName) {
}