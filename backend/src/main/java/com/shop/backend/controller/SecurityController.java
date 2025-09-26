package com.shop.backend.controller;

import com.shop.backend.service.RateLimitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class SecurityController {
    
    @Autowired
    private RateLimitService rateLimitService;
    
    @GetMapping("/rate-limit-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getRateLimitStatus(@RequestParam String clientIP) {
        Map<String, Object> status = new HashMap<>();
        
        status.put("clientIP", clientIP);
        status.put("remainingRequests", rateLimitService.getRemainingRequests(clientIP));
        status.put("resetTime", rateLimitService.getResetTime(clientIP));
        status.put("isRateLimited", rateLimitService.isRateLimited(clientIP));
        
        return ResponseEntity.ok(status);
    }
    
    @GetMapping("/security-metrics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getSecurityMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        // Basic metrics - can be expanded with more detailed monitoring
        metrics.put("timestamp", System.currentTimeMillis());
        metrics.put("rateLimitServiceActive", true);
        metrics.put("message", "Rate limiting service is active and monitoring requests");
        
        return ResponseEntity.ok(metrics);
    }
}
