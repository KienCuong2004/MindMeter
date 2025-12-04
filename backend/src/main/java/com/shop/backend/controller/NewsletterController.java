package com.shop.backend.controller;

import com.shop.backend.dto.NewsletterSubscriptionDTO;
import com.shop.backend.service.NewsletterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/newsletter")
@RequiredArgsConstructor
public class NewsletterController {
    
    private final NewsletterService newsletterService;
    
    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(@RequestBody NewsletterSubscriptionDTO dto) {
        try {
            return ResponseEntity.ok(newsletterService.subscribe(dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("{\"error\": \"Đã xảy ra lỗi khi đăng ký\"}");
        }
    }
    
    @PostMapping("/unsubscribe")
    public ResponseEntity<?> unsubscribe(@RequestParam String email) {
        try {
            newsletterService.unsubscribe(email);
            return ResponseEntity.ok("{\"message\": \"Đã hủy đăng ký thành công\"}");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("{\"error\": \"Đã xảy ra lỗi\"}");
        }
    }
    
    @GetMapping("/verify")
    public ResponseEntity<?> verify(@RequestParam String token) {
        boolean verified = newsletterService.verifySubscription(token);
        if (verified) {
            return ResponseEntity.ok("{\"message\": \"Email đã được xác nhận thành công\"}");
        }
        return ResponseEntity.badRequest().body("{\"error\": \"Token không hợp lệ hoặc đã hết hạn\"}");
    }
}

