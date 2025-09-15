package com.shop.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.lang.NonNull;

/**
 * Security Headers Configuration
 * Adds security headers to prevent various attacks
 */
@Configuration
public class SecurityHeadersConfig {

    @Bean
    public OncePerRequestFilter securityHeadersFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(@NonNull HttpServletRequest request, 
                                          @NonNull HttpServletResponse response, 
                                          @NonNull FilterChain filterChain) throws ServletException, IOException {
                
                // Content Security Policy
                response.setHeader("Content-Security-Policy", 
                    "default-src 'self'; " +
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.gstatic.com; " +
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                    "font-src 'self' https://fonts.gstatic.com; " +
                    "img-src 'self' data: https:; " +
                    "connect-src 'self' https://api.stripe.com https://api.openai.com; " +
                    "frame-src 'self' https://js.stripe.com; " +
                    "object-src 'none'; " +
                    "base-uri 'self'; " +
                    "form-action 'self'");

                // X-Content-Type-Options
                response.setHeader("X-Content-Type-Options", "nosniff");

                // X-Frame-Options
                response.setHeader("X-Frame-Options", "DENY");

                // X-XSS-Protection
                response.setHeader("X-XSS-Protection", "1; mode=block");

                // Referrer Policy
                response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

                // Permissions Policy
                response.setHeader("Permissions-Policy", 
                    "camera=(), microphone=(), geolocation=(), payment=()");

                // Strict-Transport-Security (only for HTTPS)
                if (request.isSecure()) {
                    response.setHeader("Strict-Transport-Security", 
                        "max-age=31536000; includeSubDomains; preload");
                }

                // Cache Control for sensitive endpoints
                String requestURI = request.getRequestURI();
                if (requestURI.contains("/api/auth/") || 
                    requestURI.contains("/api/admin/") || 
                    requestURI.contains("/api/expert/")) {
                    response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
                    response.setHeader("Pragma", "no-cache");
                    response.setHeader("Expires", "0");
                }

                filterChain.doFilter(request, response);
            }
        };
    }
}
