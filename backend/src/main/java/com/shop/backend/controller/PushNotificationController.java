package com.shop.backend.controller;

import com.shop.backend.service.PushNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/push-notifications")
@RequiredArgsConstructor
public class PushNotificationController {
    
    private final PushNotificationService pushNotificationService;
    
    /**
     * Register push notification subscription
     */
    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(
            @RequestBody Map<String, Object> subscription,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            pushNotificationService.registerSubscription(userId, subscription);
            return ResponseEntity.ok("{\"message\": \"Push notification subscription registered\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
    
    /**
     * Unregister push notification subscription
     */
    @PostMapping("/unsubscribe")
    public ResponseEntity<?> unsubscribe(Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            pushNotificationService.unregisterSubscription(userId);
            return ResponseEntity.ok("{\"message\": \"Push notification subscription removed\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
    
    /**
     * Helper to get user ID from authentication
     */
    private Long getUserIdFromAuth(Authentication authentication) {
        String name = authentication.getName();
        if (name.startsWith("anonymous_")) {
            return Long.parseLong(name.substring("anonymous_".length()));
        } else {
            // For now, return a placeholder - should use UserRepository
            throw new RuntimeException("User ID extraction not implemented");
        }
    }
}

