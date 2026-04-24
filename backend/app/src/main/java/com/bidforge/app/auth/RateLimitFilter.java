package com.bidforge.app.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    @Value("${rate-limit.max-requests:10}")
    private int maxRequests;

    private static final long WINDOW_MS = 60_000;

    private final ConcurrentHashMap<String, Deque<Long>> requestLog = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();
        if (!uri.equals("/auth/login") && !uri.equals("/auth/register")) {
            chain.doFilter(request, response);
            return;
        }

        String clientIp = resolveClientIp(request);
        long now = System.currentTimeMillis();

        requestLog.compute(clientIp, (ip, timestamps) -> {
            if (timestamps == null) timestamps = new ArrayDeque<>();
            while (!timestamps.isEmpty() && now - timestamps.peekFirst() > WINDOW_MS) {
                timestamps.pollFirst();
            }
            timestamps.addLast(now);
            return timestamps;
        });

        if (requestLog.get(clientIp).size() > maxRequests) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"status\":429,\"error\":\"TOO_MANY_REQUESTS\",\"message\":\"Too many requests. Please try again later.\"}"
            );
            return;
        }

        chain.doFilter(request, response);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
