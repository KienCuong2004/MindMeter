package com.shop.backend.interceptor;

import com.shop.backend.service.RateLimitService;
import com.shop.backend.service.SecurityMetricsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {
    
    @Autowired
    private RateLimitService rateLimitService;

    @Autowired
    private SecurityMetricsService securityMetricsService;
    
    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull Object handler) throws Exception {
        String clientIP = getClientIP(request);
        String requestPath = request.getRequestURI();
        
        // Bypass rate limiting for localhost in development
        if ("127.0.0.1".equals(clientIP) || "localhost".equals(clientIP) || "0:0:0:0:0:0:0:1".equals(clientIP)) {
            // Add rate limit headers but don't enforce limits
            addRateLimitHeaders(response, requestPath, clientIP);
            return true;
        }
        
        // Apply different rate limits based on endpoint
        boolean isRateLimited = false;
        
        if (requestPath.startsWith("/api/auth/")) {
            isRateLimited = rateLimitService.isAuthRateLimited(clientIP);
        } else if (requestPath.startsWith("/api/payment/")) {
            isRateLimited = rateLimitService.isPaymentRateLimited(clientIP);
        } else if (requestPath.startsWith("/api/")) {
            isRateLimited = rateLimitService.isApiRateLimited(clientIP);
        } else {
            isRateLimited = rateLimitService.isRateLimited(clientIP);
        }
        
        if (isRateLimited) {
            // Record rate limit hit in metrics
            securityMetricsService.recordRateLimitHit(requestPath, clientIP);
            
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(rateLimitService.getResetTime(clientIP)));
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Rate limit exceeded\",\"message\":\"Too many requests. Please try again later.\"}");
            return false;
        }
        
        // Record successful request
        securityMetricsService.recordRequest(requestPath, clientIP);
        
        // Add rate limit headers
        addRateLimitHeaders(response, requestPath, clientIP);
        
        return true;
    }
    
    private void addRateLimitHeaders(HttpServletResponse response, String requestPath, String clientIP) {
        // Add rate limit headers based on endpoint
        String limitHeader = "100"; // default
        if (requestPath.startsWith("/api/auth/")) {
            limitHeader = "30";
        } else if (requestPath.startsWith("/api/payment/")) {
            limitHeader = "3";
        } else if (requestPath.startsWith("/api/")) {
            limitHeader = "50";
        }
        
        response.setHeader("X-RateLimit-Limit", limitHeader);
        response.setHeader("X-RateLimit-Remaining", String.valueOf(rateLimitService.getRemainingRequests(clientIP)));
        response.setHeader("X-RateLimit-Reset", String.valueOf(rateLimitService.getResetTime(clientIP)));
    }
    
    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIP = request.getHeader("X-Real-IP");
        if (xRealIP != null && !xRealIP.isEmpty()) {
            return xRealIP;
        }
        
        return request.getRemoteAddr();
    }
}
