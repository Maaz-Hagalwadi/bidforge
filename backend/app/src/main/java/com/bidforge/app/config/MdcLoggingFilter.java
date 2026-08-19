package com.bidforge.app.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class MdcLoggingFilter extends OncePerRequestFilter {

    private static final Set<String> SKIP_URIS = Set.of("/health", "/favicon.ico");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        if (SKIP_URIS.contains(request.getRequestURI())) {
            chain.doFilter(request, response);
            return;
        }

        String requestId = UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        MDC.put("requestId", requestId);
        MDC.put("clientIp", resolveClientIp(request));
        MDC.put("method", request.getMethod());
        MDC.put("uri", request.getRequestURI());

        response.setHeader("X-Request-Id", requestId);

        long start = System.currentTimeMillis();
        try {
            log.info("→ {} {}", request.getMethod(), request.getRequestURI());
            chain.doFilter(request, response);
        } finally {
            log.info("← {} {} {} [{}ms]",
                    response.getStatus(), request.getMethod(), request.getRequestURI(),
                    System.currentTimeMillis() - start);
            MDC.clear();
        }
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) return forwarded.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
