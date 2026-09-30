package com.catchclass.auth.internal.service;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.function.Function;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catchclass.auth.PasswordResetRequested;
import com.catchclass.auth.UserRegistered;
import com.catchclass.auth.internal.config.AuthProperties;
import com.catchclass.auth.internal.dto.TokenPair;
import com.catchclass.auth.internal.entity.ActionToken;
import com.catchclass.auth.internal.entity.Credential;
import com.catchclass.auth.internal.entity.RefreshToken;
import com.catchclass.auth.internal.repository.ActionTokenRepository;
import com.catchclass.auth.internal.repository.CredentialRepository;
import com.catchclass.auth.internal.repository.RefreshTokenRepository;
import com.catchclass.auth.internal.security.JwtService;
import com.catchclass.auth.internal.security.TokenHasher;
import com.catchclass.shared.web.ApiException;
import com.catchclass.user.UserApi;
import com.catchclass.user.UserSummary;

@Service
public class AuthService {

    private final UserApi userApi;
    private final CredentialRepository credentialRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final ActionTokenRepository actionTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthProperties properties;
    private final ApplicationEventPublisher eventPublisher;

    public AuthService(UserApi userApi, CredentialRepository credentialRepository,
                       RefreshTokenRepository refreshTokenRepository, ActionTokenRepository actionTokenRepository,
                       PasswordEncoder passwordEncoder, JwtService jwtService, AuthProperties properties,
                       ApplicationEventPublisher eventPublisher) {
        this.userApi = userApi;
        this.credentialRepository = credentialRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.actionTokenRepository = actionTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.properties = properties;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public TokenPair register(String email, String displayName, String rawPassword) {
        UserSummary user = userApi.create(email, displayName);

        Credential credential = new Credential(user.id(), passwordEncoder.encode(rawPassword));
        try {
            credentialRepository.saveAndFlush(credential);
        } catch (DataIntegrityViolationException e) {
            throw conflict();
        }

        issueActionToken(user.id(), ActionToken.Type.EMAIL_VERIFICATION, properties.emailVerificationTtl(),
                rawToken -> new UserRegistered(user.id(), user.email(), user.displayName(), rawToken));

        return issueTokenPair(user.id(), user.email());
    }

    @Transactional
    public TokenPair login(String email, String rawPassword) {
        UserSummary user = userApi.findByEmail(email).orElseThrow(this::invalidCredentials);
        Credential credential = credentialRepository.findById(user.id()).orElseThrow(this::invalidCredentials);

        if (!passwordEncoder.matches(rawPassword, credential.getPasswordHash())) {
            throw invalidCredentials();
        }
        return issueTokenPair(user.id(), user.email());
    }

    @Transactional
    public TokenPair refresh(String rawRefreshToken) {
        String hash = TokenHasher.hash(rawRefreshToken);
        RefreshToken stored = refreshTokenRepository.findById(hash).orElseThrow(this::invalidRefreshToken);

        if (stored.isExpired()) {
            refreshTokenRepository.deleteByTokenHashIfExists(hash);
            throw invalidRefreshToken();
        }
        if (refreshTokenRepository.deleteByTokenHashIfExists(hash) == 0) {
            throw invalidRefreshToken();
        }

        UserSummary user = userApi.findById(stored.getUserId()).orElseThrow(this::invalidRefreshToken);
        return issueTokenPair(user.id(), user.email());
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        refreshTokenRepository.deleteByTokenHashIfExists(TokenHasher.hash(rawRefreshToken));
    }

    /** Навмисно НЕ повідомляє, чи існує такий email — інакше форма стала б способом
     *  перевірити, хто зареєстрований у системі (user enumeration). */
    @Transactional
    public void forgotPassword(String email) {
        userApi.findByEmail(email).ifPresent(user ->
                issueActionToken(user.id(), ActionToken.Type.PASSWORD_RESET, properties.passwordResetTtl(),
                        rawToken -> new PasswordResetRequested(user.id(), user.email(), rawToken)));
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        ActionToken token = consumeToken(rawToken, ActionToken.Type.PASSWORD_RESET);
        Credential credential = credentialRepository.findById(token.getUserId()).orElseThrow(this::invalidToken);
        credential.changePassword(passwordEncoder.encode(newPassword));
        // save() не потрібен: усередині @Transactional Hibernate сам збереже зміну (dirty checking).
    }

    @Transactional
    public void verifyEmail(String rawToken) {
        ActionToken token = consumeToken(rawToken, ActionToken.Type.EMAIL_VERIFICATION);
        Credential credential = credentialRepository.findById(token.getUserId()).orElseThrow(this::invalidToken);
        credential.markEmailVerified();
    }

    // ---- допоміжні методи ----

    private void issueActionToken(UUID userId, ActionToken.Type type, Duration ttl,
                                  Function<String, Object> eventFactory) {
        String rawToken = TokenHasher.generateRawToken();
        Instant expiresAt = Instant.now().plus(ttl);
        actionTokenRepository.save(new ActionToken(TokenHasher.hash(rawToken), userId, type, expiresAt));
        // Публікується лише після успішного коміту транзакції (Spring Modulith сам це гарантує
        // для @ApplicationModuleListener) — тобто лист не піде, якщо реєстрація відкотиться.
        eventPublisher.publishEvent(eventFactory.apply(rawToken));
    }

    /** Атомарно "спалює" токен: захист від подвійного використання того самого посилання. */
    private ActionToken consumeToken(String rawToken, ActionToken.Type expectedType) {
        String hash = TokenHasher.hash(rawToken);
        ActionToken token = actionTokenRepository.findById(hash).orElseThrow(this::invalidToken);

        if (token.getType() != expectedType || token.isExpired()) {
            actionTokenRepository.deleteByTokenHashIfExists(hash);
            throw invalidToken();
        }
        if (actionTokenRepository.deleteByTokenHashIfExists(hash) == 0) {
            throw invalidToken(); // хтось уже скористався цим посиланням
        }
        return token;
    }

    private TokenPair issueTokenPair(UUID userId, String email) {
        String accessToken = jwtService.generateAccessToken(userId, email);
        String rawRefreshToken = TokenHasher.generateRawToken();
        Instant expiresAt = Instant.now().plus(properties.refreshTokenTtl());
        refreshTokenRepository.save(new RefreshToken(TokenHasher.hash(rawRefreshToken), userId, expiresAt));
        return new TokenPair(accessToken, rawRefreshToken, jwtService.accessTokenTtlSeconds(),
                properties.refreshTokenTtl().toSeconds());
    }

    private ApiException invalidCredentials() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "invalid_credentials", "Неправильний email або пароль");
    }

    private ApiException invalidRefreshToken() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "invalid_refresh_token", "Сесія недійсна, увійдіть знову");
    }

    private ApiException invalidToken() {
        return new ApiException(HttpStatus.BAD_REQUEST, "invalid_token", "Посилання недійсне або протерміноване");
    }

    private ApiException conflict() {
        return new ApiException(HttpStatus.CONFLICT, "user_already_exists", "Користувач з таким email вже існує");
    }
}