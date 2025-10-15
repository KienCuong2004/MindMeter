package com.shop.backend.controller;

import com.shop.backend.model.User;
import com.shop.backend.repository.UserRepository;
import com.shop.backend.service.PayPalService;
import com.shop.backend.service.PlanManagementService;
import com.shop.backend.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {
    private static final Logger logger = Logger.getLogger(PaymentController.class.getName());

    @Value("${app.base.url:http://localhost:3000}")
    private String appBaseUrl;

    @Value("${paypal.client.id}")
    private String clientId;
    
    @Value("${paypal.mode}")
    private String mode;

    @Autowired
    private PayPalService payPalService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlanManagementService planManagementService;

    @Autowired
    private JwtService jwtService;

    // Method để kiểm tra rate limit - DISABLED FOR DEVELOPMENT
    private boolean isRateLimited(String userEmail) {
        // TEMPORARY: Disable rate limiting for development
        return false;
    }
    
    /**
     * Create PayPal payment session
     */
    @PostMapping("/create-payment")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createPayment(@RequestBody Map<String, Object> payload, 
                                         @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        String userEmail = userDetails.getUsername();
        logger.info("=== PAYPAL PAYMENT CREATE REQUEST ===");
        logger.info("User: " + userEmail);
        logger.info("Payload: " + payload.toString());
        
        // Kiểm tra rate limit
        if (isRateLimited(userEmail)) {
            logger.warning("Rate limit exceeded for user: " + userEmail);
            return ResponseEntity.status(429).body(Map.of(
                "error", "Rate limit exceeded. Please try again later.",
                "retryAfter", 60
            ));
        }
        
        String plan = (String) payload.getOrDefault("plan", "plus");
        logger.info("Creating payment for plan: " + plan);
        
        // Lấy user hiện tại
        User currentUser = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        if (currentUser == null) {
            logger.severe("User not found: " + userDetails.getUsername());
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }
        
        try {
            logger.info("Calling PayPal service to create payment...");
            Map<String, String> paymentResult = payPalService.createPayment(plan, "USD", "MindMeter " + plan.toUpperCase() + " Plan", currentUser.getEmail());
            
            logger.info("PayPal payment created successfully: " + paymentResult.toString());
            
            Map<String, String> response = new HashMap<>();
            response.put("url", paymentResult.get("approval_url"));
            response.put("paymentId", paymentResult.get("paymentId"));
            
            logger.info("Returning response: " + response.toString());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.severe("Error creating PayPal payment: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Execute PayPal payment after approval
     */
    @PostMapping("/execute-payment")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> executePayment(@RequestBody Map<String, String> payload,
                                          @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        String userEmail = userDetails.getUsername();
        String paymentId = payload.get("paymentId");
        String payerId = payload.get("payerId");
        
        logger.info("=== PAYPAL PAYMENT EXECUTE REQUEST ===");
        logger.info("User: " + userEmail);
        logger.info("PaymentId: " + paymentId);
        logger.info("PayerId: " + payerId);
        logger.info("Payload: " + payload.toString());
        
        if (paymentId == null || payerId == null) {
            logger.severe("Missing paymentId or payerId");
            return ResponseEntity.badRequest().body(Map.of("error", "Missing paymentId or payerId"));
        }
        
        try {
            logger.info("Calling PayPal service to execute payment...");
            Map<String, Object> result = payPalService.executePayment(paymentId, payerId, userDetails.getUsername());
            
            logger.info("PayPal payment execution result: " + result.toString());
            
            String status = (String) result.get("status");
            if ("approved".equalsIgnoreCase(status)) {
                logger.info("Payment approved, updating user plan...");
                // Update user plan
                User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
                if (user != null) {
                    String plan = (String) result.getOrDefault("plan", "PLUS");
                    logger.info("Updating user plan from " + user.getPlan() + " to " + plan);
                    planManagementService.updateUserPlan(user, plan);
                    logger.info("User plan updated to: " + plan + " for user: " + user.getEmail());
                } else {
                    logger.severe("User not found for plan update: " + userDetails.getUsername());
                }
                
                return ResponseEntity.ok(Map.of("success", true, "message", "Payment completed successfully"));
            } else {
                logger.warning("Payment not approved, status: " + status);
                return ResponseEntity.badRequest().body(Map.of("error", "Payment execution failed"));
            }
        } catch (Exception e) {
            logger.severe("Error executing PayPal payment: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get payment status
     */
    @GetMapping("/status/{paymentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getPaymentStatus(@PathVariable String paymentId) {
        try {
            var payment = payPalService.getPaymentDetails(paymentId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("paymentId", payment.getId());
            result.put("state", payment.getState());
            result.put("intent", payment.getIntent());
            
            if (payment.getTransactions() != null && !payment.getTransactions().isEmpty()) {
                var transaction = payment.getTransactions().get(0);
                result.put("amount", transaction.getAmount().getTotal());
                result.put("currency", transaction.getAmount().getCurrency());
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.severe("Error getting payment status: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * PayPal webhook handler
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> handlePayPalWebhook(@RequestBody String payload) {
        logger.info("PayPal webhook received: " + payload);
        
        // For now, just log the webhook - webhook processing can be implemented later if needed
        
        return ResponseEntity.ok("success");
    }
    
    /**
     * Get PayPal status
     */
    @GetMapping("/paypal-status")
    public ResponseEntity<?> getPayPalStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("mode", "sandbox"); // Will be configured via properties
        status.put("clientId", clientId != null ? clientId.substring(0, Math.min(10, clientId.length())) + "..." : "Not configured");
        status.put("isTestMode", "sandbox".equalsIgnoreCase(mode));
        status.put("isProductionMode", "live".equalsIgnoreCase(mode));
        
        return ResponseEntity.ok(status);
    }
    
    /**
     * Refresh user token after payment
     */
    @PostMapping("/refresh-token")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> refreshPaymentToken(@AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        try {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
            if (user != null) {
                String newToken = jwtService.generateTokenWithUserInfo(user);
                
                Map<String, Object> response = new HashMap<>();
                response.put("token", newToken);
                
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("id", user.getId());
                userInfo.put("email", user.getEmail());
                userInfo.put("firstName", user.getFirstName() != null ? user.getFirstName() : "");
                userInfo.put("lastName", user.getLastName() != null ? user.getLastName() : "");
                userInfo.put("role", user.getRole() != null ? user.getRole().toString() : "STUDENT");
                userInfo.put("plan", user.getPlan() != null ? user.getPlan() : "FREE");
                userInfo.put("planStartDate", user.getPlanStartDate() != null ? user.getPlanStartDate().toString() : null);
                userInfo.put("planExpiryDate", user.getPlanExpiryDate() != null ? user.getPlanExpiryDate().toString() : null);
                userInfo.put("avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : null);
                userInfo.put("phone", user.getPhone() != null ? user.getPhone() : "");
                
                response.put("user", userInfo);
                
                logger.info("Token refreshed for user: " + user.getEmail() + " with plan: " + user.getPlan());
                return ResponseEntity.ok(response);
            } else {
                logger.warning("User not found for email: " + userDetails.getUsername());
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.severe("Error refreshing token: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error"));
        }
    }
} 
