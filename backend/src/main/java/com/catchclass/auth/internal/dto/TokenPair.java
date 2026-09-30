package com.catchclass.auth.internal.dto;

public record TokenPair(String accessToken, String refreshToken, long accessTokenTtlSeconds, long refreshTokenTtlSeconds) {
}