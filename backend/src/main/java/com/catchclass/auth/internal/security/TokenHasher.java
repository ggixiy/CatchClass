package com.catchclass.auth.internal.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

public final class TokenHasher {

    private static final SecureRandom RANDOM = new SecureRandom();

    private TokenHasher() {
    }

    /** 256 випадкових бітів у вигляді рядка, безпечного для передачі як кука. */
    public static String generateRawToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** SHA-256 від сирого токена — саме це, а не сам токен, лежить у БД. */
    public static String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 недоступний", e);
        }
    }
}