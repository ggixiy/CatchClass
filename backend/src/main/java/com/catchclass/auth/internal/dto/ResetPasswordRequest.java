package com.catchclass.auth.internal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank String token,
        @NotBlank @Size(min = 8, max = 72)
        @Pattern(regexp = PasswordPolicy.REGEX, message = PasswordPolicy.MESSAGE)
        String newPassword
) {
}