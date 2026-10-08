package com.catchclass.room.internal.dto;

import jakarta.validation.constraints.NotBlank;

public record JoinRoomRequest(@NotBlank String publicId, String password) {
}