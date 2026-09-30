package com.catchclass.auth;

import java.util.UUID;

/**
 * Подія: користувач запросив скидання пароля.
 * Публікується AuthService.forgotPassword(). Слухає notification-модуль (лист із посиланням).
 */
public record PasswordResetRequested(UUID userId, String email, String resetToken) {
}