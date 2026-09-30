package com.catchclass.auth.internal.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "catchclass.auth")
public record AuthProperties(
        String jwtSecret,
        Duration accessTokenTtl,
        Duration refreshTokenTtl,
        Duration emailVerificationTtl,
        Duration passwordResetTtl
) {
}