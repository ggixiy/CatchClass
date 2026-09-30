package com.catchclass.auth.internal.dto;

public record TokenResponse(String accessToken, String tokenType, long expiresInSeconds) {
}