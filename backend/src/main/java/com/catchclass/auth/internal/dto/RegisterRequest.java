package com.catchclass.auth.internal.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(max = 100) String displayName,

        @NotBlank
        @Size(min = 8, max = 72) // 72 — межа самого BCrypt, довше він просто не побачить
        @Pattern(regexp = PasswordPolicy.REGEX, message = PasswordPolicy.MESSAGE)
        String password
) {
}