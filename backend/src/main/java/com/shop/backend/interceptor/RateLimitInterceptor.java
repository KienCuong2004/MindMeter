package com.shop.backend.interceptor;

import com.shop.backend.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {
    
    @Autowired
    private RateLimitService rateLimitService;
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String clientIP = getClientIP(request);
        String requestPath = request.getRequestURI();
        
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
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(rateLimitService.getResetTime(clientIP)));
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Rate limit exceeded\",\"message\":\"Too many requests. Please try again later.\"}");
            return false;
        }
        
        // Add rate limit headers
        response.setHeader("X-RateLimit-Limit", "100");
        response.setHeader("X-RateLimit-Remaining", String.valueOf(rateLimitService.getRemainingRequests(clientIP)));
        response.setHeader("X-RateLimit-Reset", String.valueOf(rateLimitService.getResetTime(clientIP)));
        
        return true;
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
