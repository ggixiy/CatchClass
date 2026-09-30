package com.catchclass.auth.internal.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import com.catchclass.auth.internal.config.AuthProperties;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtService {

    private final AuthProperties properties;
    private final SecretKey signingKey;

    public JwtService(AuthProperties properties) {
        this.properties = properties;
        this.signingKey = Keys.hmacShaKeyFor(properties.jwtSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(UUID userId, String email) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(properties.accessTokenTtl())))
                .signWith(signingKey)
                .compact();
    }

    public long accessTokenTtlSeconds() {
        return properties.accessTokenTtl().toSeconds();
    }

    public ParsedToken parse(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return new ParsedToken(UUID.fromString(claims.getSubject()), claims.get("email", String.class));
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    public record ParsedToken(UUID userId, String email) {
    }
}