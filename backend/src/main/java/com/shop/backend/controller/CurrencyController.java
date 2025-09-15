package com.shop.backend.controller;

import com.stripe.Stripe;
import com.shop.backend.service.CurrencyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;

@RestController
@RequestMapping("/api/currency")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class CurrencyController {
    
    private static final Logger logger = Logger.getLogger(CurrencyController.class.getName());
    
    @Value("${stripe.api.key}")
    private String stripeApiKey;
    
    @Autowired
    private CurrencyService currencyService;
    
    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }
    
    /**
     * Lấy tỷ giá VND từ external API
     */
    @GetMapping("/vnd-rate")
    public ResponseEntity<?> getVndRate() {
        try {
            double vndRate = currencyService.getUsdToVndRate();
            
            Map<String, Object> response = new HashMap<>();
            response.put("usdToVnd", vndRate);
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.severe("Error getting VND rate: " + e.getMessage());
            
            // Fallback rate nếu có lỗi
            Map<String, Object> fallbackResponse = new HashMap<>();
            fallbackResponse.put("usdToVnd", 27469.67); // Tỷ giá fallback
            fallbackResponse.put("timestamp", System.currentTimeMillis());
            fallbackResponse.put("fallback", true);
            
            return ResponseEntity.ok(fallbackResponse);
        }
    }
    
    /**
     * Lấy giá VND cho các gói dịch vụ
     */
    @GetMapping("/pricing-vnd")
    public ResponseEntity<?> getPricingVnd() {
        try {
            Map<String, Object> response = currencyService.getPricingVnd();
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.severe("Error getting pricing VND: " + e.getMessage());
            
            // Fallback pricing
            Map<String, Object> fallbackResponse = new HashMap<>();
            fallbackResponse.put("free", Map.of("usd", 0.0, "vnd", 0, "vndFormatted", "0đ"));
            fallbackResponse.put("plus", Map.of("usd", 3.99, "vnd", 109604, "vndFormatted", "109.604đ"));
            fallbackResponse.put("pro", Map.of("usd", 9.99, "vnd", 274422, "vndFormatted", "274.422đ"));
            fallbackResponse.put("rate", 27469.67);
            fallbackResponse.put("timestamp", System.currentTimeMillis());
            fallbackResponse.put("fallback", true);
            
            return ResponseEntity.ok(fallbackResponse);
        }
    }
    
}
