package com.catchclass.auth.internal.controller;

import com.catchclass.auth.internal.dto.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.Duration;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.catchclass.auth.internal.service.AuthService;
import com.catchclass.shared.web.ApiException;
import com.catchclass.shared.web.AttemptLimiter;

@RestController
@RequestMapping("/api/auth")
class AuthController {

    private static final String REFRESH_COOKIE = "refreshToken";

    private static final Duration LOGIN_WINDOW = Duration.ofMinutes(15);

    private final AuthService authService;
    private final AttemptLimiter limiter;

    AuthController(AuthService authService, AttemptLimiter limiter) {
        this.authService = authService;
        this.limiter = limiter;
    }

    @PostMapping("/register")
    ResponseEntity<TokenResponse> register(@Valid @RequestBody RegisterRequest request) {
        return withRefreshCookie(authService.register(request.email(), request.displayName(), request.password()),
                HttpStatus.CREATED);
    }

    @PostMapping("/login")
    ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        String ip = http.getRemoteAddr();
        // Перебір пароля до одного акаунта: 5 невдалих спроб за 15 хв з однієї IP.
        // Перебір багатьох акаунтів з однієї IP (credential stuffing): 20 невдалих спроб за 15 хв.
        String perAccount = "login:" + ip + ":" + request.email().trim().toLowerCase();
        TokenPair pair = limiter.guardFailures("login-ip:" + ip, 20, LOGIN_WINDOW,
                () -> limiter.guardFailures(perAccount, 5, LOGIN_WINDOW,
                        () -> authService.login(request.email(), request.password())));
        return withRefreshCookie(pair, HttpStatus.OK);
    }

    @PostMapping("/refresh")
    ResponseEntity<TokenResponse> refresh(
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken) {
        if (refreshToken == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "invalid_refresh_token", "Сесія недійсна, увійдіть знову");
        }
        return withRefreshCookie(authService.refresh(refreshToken), HttpStatus.OK);
    }

    @PostMapping("/logout")
    ResponseEntity<Void> logout(@CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken) {
        if (refreshToken != null) {
            authService.logout(refreshToken);
        }
        ResponseCookie cleared = ResponseCookie.from(REFRESH_COOKIE, "")
                .httpOnly(true).path("/api/auth").maxAge(0).build();
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, cleared.toString()).build();
    }

    private ResponseEntity<TokenResponse> withRefreshCookie(TokenPair tokens, HttpStatus status) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, tokens.refreshToken())
                .httpOnly(true)                 // JS не бачить цю куку взагалі
                .secure(false)                  // TODO(крок деплою): true, коли буде HTTPS
                .sameSite("Lax")
                .path("/api/auth")              // кука летить лише на /api/auth/*, нікуди більше
                .maxAge(tokens.refreshTokenTtlSeconds())
                .build();

        TokenResponse body = new TokenResponse(tokens.accessToken(), "Bearer", tokens.accessTokenTtlSeconds());
        return ResponseEntity.status(status).header(HttpHeaders.SET_COOKIE, cookie.toString()).body(body);
    }

    @PostMapping("/forgot-password")
    ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.email());
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/reset-password")
    ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.noContent().build();
    }
}