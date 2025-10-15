package com.shop.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.logging.Logger;
import org.springframework.lang.NonNull;

/**
 * Rate Limiting Configuration
 * Prevents abuse and DoS attacks
 */
@Configuration
public class RateLimitingConfig {

    private static final Logger logger = Logger.getLogger(RateLimitingConfig.class.getName());

    // Rate limiting configuration - DISABLED FOR DEVELOPMENT
    // All rate limiting is temporarily disabled for development

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
        
        // Debug log for development
        logger.info("Rate limit check - Client ID: " + clientId + ", URI: " + requestURI);
        
        // For development: Disable rate limit for localhost completely
        if ("127.0.0.1".equals(clientId) || "localhost".equals(clientId) || "0:0:0:0:0:0:0:1".equals(clientId)) {
            logger.info("Rate limit bypassed for localhost: " + clientId);
            return true; // Skip rate limiting for localhost in development
        }
        
        // TEMPORARY: Disable rate limiting completely for development
        logger.info("Rate limit disabled for development - allowing request");
        return true;
    }

    private void cleanupOldEntries(long currentTime) {
        // No cleanup needed since rate limiting is disabled
    }
}
