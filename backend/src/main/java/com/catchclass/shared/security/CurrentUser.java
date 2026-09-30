package com.catchclass.shared.security;

import java.util.UUID;

import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public record CurrentUser(UUID id, String email) {

    public static CurrentUser require() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CurrentUser user) {
            return user;
        }
        throw new AuthenticationCredentialsNotFoundException("Користувач не автентифікований");
    }
}