package com.shop.backend.controller;

import com.shop.backend.service.GoogleCalendarService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller để quản lý Google Calendar API OAuth flow
 */
@RestController
@RequestMapping("/api/google-calendar")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class GoogleCalendarController {
    
    private final GoogleCalendarService googleCalendarService;
    
    /**
     * Lấy authorization URL để user authorize Google Calendar API
     */
    @GetMapping("/authorize")
    public ResponseEntity<Map<String, String>> getAuthorizationUrl() {
        try {
            String authorizationUrl = googleCalendarService.getAuthorizationUrl();
            Map<String, String> response = new HashMap<>();
            response.put("authorizationUrl", authorizationUrl);
            response.put("message", "Vui lòng mở URL này trong browser để authorize Google Calendar API");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Lỗi khi get authorization URL: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Initiate OAuth flow để authenticate với Google Calendar API
     * Endpoint này sẽ mở browser để user authorize (chạy trong thread riêng để không block)
     */
    @PostMapping("/initiate")
    public ResponseEntity<Map<String, String>> initiateOAuthFlow() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Đang mở browser để authorize Google Calendar API. Vui lòng hoàn tất quá trình authorize trong browser.");
        
        // Chạy OAuth flow trong thread riêng để không block request
        new Thread(() -> {
            try {
                boolean success = googleCalendarService.initiateOAuthFlow();
                if (success) {
                    log.info("OAuth flow completed successfully");
                }
            } catch (Exception e) {
                log.error("Lỗi khi initiate OAuth flow: {}", e.getMessage(), e);
            }
        }).start();
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Kiểm tra trạng thái authentication
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("enabled", googleCalendarService.isEnabled());
        status.put("authenticated", googleCalendarService.isAuthenticated());
        return ResponseEntity.ok(status);
    }
    
    /**
     * Xóa token cũ và authenticate lại
     */
    @PostMapping("/reset")
    public ResponseEntity<Map<String, String>> resetAndAuthenticate() {
        try {
            // Xóa token cũ
            googleCalendarService.deleteToken();
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Token đã được xóa. Đang mở browser để authenticate lại...");
            
            // Chạy OAuth flow trong thread riêng để không block request
            new Thread(() -> {
                try {
                    Thread.sleep(1000); // Đợi 1 giây để response được gửi về
                    boolean success = googleCalendarService.initiateOAuthFlow();
                    if (success) {
                        log.info("OAuth flow completed successfully after reset");
                    }
                } catch (Exception e) {
                    log.error("Lỗi khi initiate OAuth flow sau khi reset: {}", e.getMessage(), e);
                }
            }).start();
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Lỗi khi reset token: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}

