package com.shop.backend.service;

import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class RateLimitService {
    
    // Track request times for each IP
    private final ConcurrentHashMap<String, Long> requestTimes = new ConcurrentHashMap<>();
    
    // Track request counts for each IP
    private final ConcurrentHashMap<String, Integer> requestCounts = new ConcurrentHashMap<>();
    
    // Rate limit configurations
    private static final long RATE_LIMIT_WINDOW = TimeUnit.MINUTES.toMillis(1); // 1 minute window
    private static final int MAX_REQUESTS_PER_WINDOW = 100; // 100 requests per minute per IP
    
    // Specific endpoint limits
    private static final int MAX_AUTH_REQUESTS = 30; // 30 auth requests per minute
    private static final int MAX_API_REQUESTS = 50; // 50 API requests per minute
    private static final int MAX_PAYMENT_REQUESTS = 100; // 100 payment requests per minute for development
    
    public boolean isRateLimited(String clientIP) {
        return isRateLimited(clientIP, MAX_REQUESTS_PER_WINDOW);
    }
    
    public boolean isRateLimited(String clientIP, int maxRequests) {
        long now = System.currentTimeMillis();
        String key = clientIP + "_" + (now / RATE_LIMIT_WINDOW);
        
        // Get current count for this window
        int currentCount = requestCounts.getOrDefault(key, 0);
        
        // Check if limit exceeded
        if (currentCount >= maxRequests) {
            return true;
        }
        
        // Increment count
        requestCounts.put(key, currentCount + 1);
        requestTimes.put(key, now);
        
        // Clean up old entries
        cleanupOldEntries(now);
        
        return false;
    }
    
    public boolean isAuthRateLimited(String clientIP) {
        return isRateLimited(clientIP, MAX_AUTH_REQUESTS);
    }
    
    public boolean isApiRateLimited(String clientIP) {
        return isRateLimited(clientIP, MAX_API_REQUESTS);
    }
    
    public boolean isPaymentRateLimited(String clientIP) {
        return isRateLimited(clientIP, MAX_PAYMENT_REQUESTS);
    }
    
    private void cleanupOldEntries(long now) {
        // Remove entries older than 2 windows to prevent memory leaks
        long cutoffTime = now - (2 * RATE_LIMIT_WINDOW);
        
        requestTimes.entrySet().removeIf(entry -> entry.getValue() < cutoffTime);
        requestCounts.entrySet().removeIf(entry -> {
            String key = entry.getKey();
            Long time = requestTimes.get(key);
            return time != null && time < cutoffTime;
        });
    }
    
    public int getRemainingRequests(String clientIP) {
        long now = System.currentTimeMillis();
        String key = clientIP + "_" + (now / RATE_LIMIT_WINDOW);
        int currentCount = requestCounts.getOrDefault(key, 0);
        return Math.max(0, MAX_REQUESTS_PER_WINDOW - currentCount);
    }
    
    public long getResetTime(String clientIP) {
        long now = System.currentTimeMillis();
        long windowStart = (now / RATE_LIMIT_WINDOW) * RATE_LIMIT_WINDOW;
        return windowStart + RATE_LIMIT_WINDOW;
    }
}
