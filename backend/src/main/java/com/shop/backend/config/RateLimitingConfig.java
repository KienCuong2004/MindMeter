package com.shop.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.logging.Logger;
import org.springframework.lang.NonNull;

/**
 * Rate Limiting Configuration
 * Prevents abuse and DoS attacks
 */
@Configuration
public class RateLimitingConfig {

    private static final Logger logger = Logger.getLogger(RateLimitingConfig.class.getName());

    // Rate limiting configuration
    private static final int MAX_REQUESTS_PER_MINUTE = 300; // Increased for development
    private static final int MAX_REQUESTS_PER_HOUR = 5000; // Increased for development
    private static final int MAX_AUTH_REQUESTS_PER_MINUTE = 100; // Increased for anonymous accounts
    private static final int MAX_ANONYMOUS_REQUESTS_PER_MINUTE = 200; // Special limit for anonymous
    private static final int MAX_PAYMENT_REQUESTS_PER_MINUTE = 10;
    private static final int MAX_BLOG_REQUESTS_PER_MINUTE = 200; // Special limit for blog

    // In-memory storage for rate limiting (in production, use Redis)
    private final ConcurrentHashMap<String, RateLimitData> rateLimitStore = new ConcurrentHashMap<>();

    @Bean
    public OncePerRequestFilter rateLimitingFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(@NonNull HttpServletRequest request, 
                                          @NonNull HttpServletResponse response, 
                                          @NonNull FilterChain filterChain) throws ServletException, IOException {
                
                String clientId = getClientIdentifier(request);
                String requestURI = request.getRequestURI();
                
                // Check rate limits
                if (!isAllowed(clientId, requestURI)) {
                    response.setStatus(429); // HTTP 429 Too Many Requests
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\": \"Rate limit exceeded. Please try again later.\"}");
                    return;
                }

                filterChain.doFilter(request, response);
            }
        };
    }

    private String getClientIdentifier(HttpServletRequest request) {
        // Use IP address as client identifier
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private boolean isAllowed(String clientId, String requestURI) {
        long currentTime = System.currentTimeMillis();
        
        // Clean up old entries
        cleanupOldEntries(currentTime);
        
        // For development: Reset rate limit for localhost every 30 seconds
        if ("127.0.0.1".equals(clientId) || "localhost".equals(clientId) || "0:0:0:0:0:0:0:1".equals(clientId)) {
            RateLimitData existingData = rateLimitStore.get(clientId);
            if (existingData != null && currentTime - existingData.lastMinuteReset > 30000) { // 30 seconds for dev
                existingData.minuteCount.set(0);
                existingData.lastMinuteReset = currentTime;
            }
        }
        
        RateLimitData data = rateLimitStore.computeIfAbsent(clientId, k -> new RateLimitData());
        
        // Determine rate limit based on endpoint
        int maxRequests;
        if (requestURI.contains("/api/auth/anonymous/")) {
            maxRequests = MAX_ANONYMOUS_REQUESTS_PER_MINUTE;
        } else if (requestURI.contains("/api/auth/")) {
            maxRequests = MAX_AUTH_REQUESTS_PER_MINUTE;
        } else if (requestURI.contains("/api/payment/")) {
            maxRequests = MAX_PAYMENT_REQUESTS_PER_MINUTE;
        } else if (requestURI.contains("/api/blog/") || requestURI.contains("/uploads/blog/")) {
            maxRequests = MAX_BLOG_REQUESTS_PER_MINUTE;
        } else {
            maxRequests = MAX_REQUESTS_PER_MINUTE;
        }
        
        // Check minute-based rate limit
        if (currentTime - data.lastMinuteReset > 60000) { // 1 minute
            data.minuteCount.set(0);
            data.lastMinuteReset = currentTime;
        }
        
        if (data.minuteCount.get() >= maxRequests) {
            logger.warning("Rate limit exceeded for client: " + clientId + " on endpoint: " + requestURI);
            return false;
        }
        
        // Check hour-based rate limit
        if (currentTime - data.lastHourReset > 3600000) { // 1 hour
            data.hourCount.set(0);
            data.lastHourReset = currentTime;
        }
        
        if (data.hourCount.get() >= MAX_REQUESTS_PER_HOUR) {
            logger.warning("Hourly rate limit exceeded for client: " + clientId);
            return false;
        }
        
        // Increment counters
        data.minuteCount.incrementAndGet();
        data.hourCount.incrementAndGet();
        
        return true;
    }

    private void cleanupOldEntries(long currentTime) {
        // Remove entries older than 1 hour
        rateLimitStore.entrySet().removeIf(entry -> 
            currentTime - entry.getValue().lastHourReset > 3600000);
    }

    private static class RateLimitData {
        private final AtomicInteger minuteCount = new AtomicInteger(0);
        private final AtomicInteger hourCount = new AtomicInteger(0);
        private volatile long lastMinuteReset = System.currentTimeMillis();
        private volatile long lastHourReset = System.currentTimeMillis();
    }
}
