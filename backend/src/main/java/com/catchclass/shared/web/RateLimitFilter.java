package com.catchclass.shared.web;

import java.io.IOException;
import java.time.Duration;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Загальний ліміт частоти запитів до публічних auth-ендпоінтів з однієї IP-адреси. */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Duration WINDOW = Duration.ofMinutes(1);
    private static final int AUTH_LIMIT = 30;     // register/login/forgot/reset
    private static final int REFRESH_LIMIT = 60;  // refresh викликається і автоматично

    private final AttemptLimiter limiter;

    public RateLimitFilter(AttemptLimiter limiter) {
        this.limiter = limiter;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !"POST".equals(request.getMethod()) || !request.getRequestURI().startsWith("/api/auth/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        boolean refresh = path.equals("/api/auth/refresh");
        try {
            limiter.hit((refresh ? "refresh:" : "auth:") + request.getRemoteAddr(),
                    refresh ? REFRESH_LIMIT : AUTH_LIMIT, WINDOW);
        } catch (TooManyRequestsException e) {
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(e.getRetryAfterSeconds()));
            response.setContentType("application/problem+json;charset=UTF-8");
            response.getWriter().write("{\"status\":429,\"code\":\"too_many_requests\",\"detail\":\""
                    + e.getMessage() + "\",\"retryAfterSeconds\":" + e.getRetryAfterSeconds() + "}");
            return;
        }
        chain.doFilter(request, response);
    }
}
