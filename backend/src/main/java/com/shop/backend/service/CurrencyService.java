package com.shop.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;

import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;

@Service
public class CurrencyService {
    
    private static final Logger logger = Logger.getLogger(CurrencyService.class.getName());
    
    @Value("${currency.api.key:}")
    private String currencyApiKey;
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    /**
     * Lấy tỷ giá USD to VND từ external API
     */
    public double getUsdToVndRate() {
        try {
            // Sử dụng Fixer.io API (miễn phí)
            String url = "http://api.exchangerate-api.com/v4/latest/USD";
            
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> body = (Map<String, Object>) response.getBody();
                if (body != null && body.containsKey("rates")) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> rates = (Map<String, Object>) body.get("rates");
                    if (rates != null && rates.containsKey("VND")) {
                        double rate = ((Number) rates.get("VND")).doubleValue();
                        logger.info("USD to VND rate: " + rate);
                        return rate;
                    }
                }
            }
            
        } catch (Exception e) {
            logger.warning("Error fetching currency rate from API: " + e.getMessage());
        }
        
        // Fallback rate nếu API không hoạt động
        return 27469.67;
    }
    
    /**
     * Lấy giá VND cho các gói dịch vụ
     */
    public Map<String, Object> getPricingVnd() {
        double vndRate = getUsdToVndRate();
        
        Map<String, Object> response = new HashMap<>();
        
        // Tính giá VND cho từng gói
        response.put("free", Map.of(
            "usd", 0.0,
            "vnd", 0,
            "vndFormatted", "0đ"
        ));
        
        response.put("plus", Map.of(
            "usd", 3.99,
            "vnd", Math.round(3.99 * vndRate),
            "vndFormatted", formatVnd(Math.round(3.99 * vndRate))
        ));
        
        response.put("pro", Map.of(
            "usd", 9.99,
            "vnd", Math.round(9.99 * vndRate),
            "vndFormatted", formatVnd(Math.round(9.99 * vndRate))
        ));
        
        response.put("rate", vndRate);
        response.put("timestamp", System.currentTimeMillis());
        
        return response;
    }
    
    /**
     * Format số tiền VND
     */
    private String formatVnd(long amount) {
        return String.format("%,dđ", amount).replace(",", ".");
    }
}
