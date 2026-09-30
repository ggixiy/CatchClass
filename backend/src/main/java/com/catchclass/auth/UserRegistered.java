package com.catchclass.auth;

import java.util.UUID;

/**
 * Подія: користувач зареєструвався й має підтвердити email.
 * Публікується AuthService.register() ПІСЛЯ успішного коміту транзакції.
 * Слухає notification-модуль (лист підтвердження) — без цього прямого звʼязку
 * auth взагалі не знав би, що notification існує.
 */
public record UserRegistered(UUID userId, String email, String displayName, String verificationToken) {
}