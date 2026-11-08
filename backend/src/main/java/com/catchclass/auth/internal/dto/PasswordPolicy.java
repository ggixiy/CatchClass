package com.catchclass.auth.internal.dto;

final class PasswordPolicy {
    static final String REGEX = "^(?=.*[0-9])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).{8,}$";
    static final String MESSAGE = "Пароль має містити щонайменше одну цифру та один спецсимвол";

    private PasswordPolicy() {
    }
}