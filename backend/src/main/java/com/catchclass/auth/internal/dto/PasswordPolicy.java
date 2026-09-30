package com.catchclass.auth.internal.dto;

final class PasswordPolicy {
    // static final String — компілятор вважає це константою, тому можна підставляти
    // прямо в атрибути анотацій (@Pattern(regexp = ...)), які вимагають значень часу компіляції.
    static final String REGEX = "^(?=.*[0-9])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).{8,}$";
    static final String MESSAGE = "Пароль має містити щонайменше одну цифру та один спецсимвол";

    private PasswordPolicy() {
    }
}