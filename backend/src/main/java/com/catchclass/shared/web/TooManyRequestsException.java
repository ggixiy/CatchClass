package com.catchclass.shared.web;

import org.springframework.http.HttpStatus;

/** Перевищено ліміт спроб/запитів; клієнту повертаємо 429 і Retry-After. */
public class TooManyRequestsException extends ApiException {

    private final long retryAfterSeconds;

    public TooManyRequestsException(long retryAfterSeconds) {
        super(HttpStatus.TOO_MANY_REQUESTS, "too_many_requests",
                "Забагато спроб. Спробуйте ще раз через " + formatWait(retryAfterSeconds));
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }

    static String formatWait(long seconds) {
        if (seconds <= 60) {
            return seconds + " с";
        }
        return ((seconds + 59) / 60) + " хв";
    }
}
