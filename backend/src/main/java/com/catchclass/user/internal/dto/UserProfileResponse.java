package com.catchclass.user.internal.dto;

import java.util.UUID;

public record UserProfileResponse(UUID id, String email, String displayName, String photoUrl, String bannerUrl) {
}
