package com.catchclass.shared.web;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * Захист від перебору (brute force): ковзне вікно подій у пам'яті.
 * Достатньо для одного інстансу застосунку; для кількох потрібне спільне сховище (наприклад, Redis).
 */
@Component
public class AttemptLimiter {

    private static final int CLEANUP_THRESHOLD = 10_000;

    private final Map<String, Deque<Long>> events = new ConcurrentHashMap<>();

    /** Кидає 429, якщо за вікно вже зафіксовано max і більше подій для цього ключа. */
    public void assertAllowed(String key, int max, Duration window) {
        long wait = retryAfterSeconds(key, max, window);
        if (wait > 0) {
            throw new TooManyRequestsException(wait);
        }
    }

    /** Фіксує подію й кидає 429, якщо після неї ліміт перевищено (для лімітування всіх запитів). */
    public void hit(String key, int max, Duration window) {
        record(key, window);
        long wait = retryAfterSeconds(key, max + 1, window);
        if (wait > 0) {
            throw new TooManyRequestsException(wait);
        }
    }

    /**
     * Виконує дію з лічильником невдач: перед викликом перевіряє ліміт, невдалою вважається
     * відповідь 401 (неправильні облікові дані), успіх скидає лічильник.
     */
    public <T> T guardFailures(String key, int max, Duration window, Supplier<T> action) {
        assertAllowed(key, max, window);
        try {
            T result = action.get();
            reset(key);
            return result;
        } catch (ApiException e) {
            if (e.getStatus() == HttpStatus.UNAUTHORIZED) {
                record(key, window);
            }
            throw e;
        }
    }

    public void record(String key, Duration window) {
        long now = System.currentTimeMillis();
        if (events.size() > CLEANUP_THRESHOLD) {
            cleanup(now - window.toMillis());
        }
        Deque<Long> q = events.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (q) {
            q.addLast(now);
        }
    }

    public void reset(String key) {
        events.remove(key);
    }

    private long retryAfterSeconds(String key, int max, Duration window) {
        Deque<Long> q = events.get(key);
        if (q == null) {
            return 0;
        }
        long now = System.currentTimeMillis();
        synchronized (q) {
            while (!q.isEmpty() && now - q.peekFirst() >= window.toMillis()) {
                q.pollFirst();
            }
            if (q.size() < max) {
                return 0;
            }
            // Ліміт знімається, коли найстарша з "активних" подій вийде з вікна.
            long oldestRelevant = q.stream().skip(q.size() - max).findFirst().orElse(now);
            return Math.max(1, (oldestRelevant + window.toMillis() - now + 999) / 1000);
        }
    }

    private void cleanup(long threshold) {
        events.entrySet().removeIf(e -> {
            Deque<Long> q = e.getValue();
            synchronized (q) {
                return q.isEmpty() || q.peekLast() < threshold;
            }
        });
    }
}
