package com.shop.backend.controller;

import com.shop.backend.model.User;
import com.shop.backend.repository.UserRepository;
import com.shop.backend.service.PlanManagementService;
import com.shop.backend.service.VNPayService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment/vnpay")
@CrossOrigin(origins = "http://localhost:3000")
public class VNPayController {

    private static final Logger logger = LoggerFactory.getLogger(VNPayController.class);

    @Autowired
    private VNPayService vnPayService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlanManagementService planManagementService;

    /**
     * Tạo URL thanh toán VNPay
     */
    @PostMapping("/create-payment")
    public ResponseEntity<?> createPayment(@RequestBody Map<String, Object> payload,
                                         @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
                                         HttpServletRequest request) {
        String userEmail = userDetails.getUsername();
        logger.info("=== VNPAY PAYMENT CREATE REQUEST ===");
        logger.info("User: {}", userEmail);
        logger.info("Payload: {}", payload.toString());

        try {
            // Get user info
            User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user == null) {
                logger.error("User not found: {}", userEmail);
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            String plan = (String) payload.getOrDefault("plan", "plus");
            String amount = (String) payload.getOrDefault("amount", "3.99");
            String clientIp = getClientIpAddress(request);

            logger.info("Creating VNPay payment for plan: {}, amount: {}, clientIp: {}", plan, amount, clientIp);

            // Create VNPay payment URL
            Map<String, String> paymentResult = vnPayService.createPaymentUrl(plan, amount, userEmail, clientIp);
            
            Map<String, String> response = new HashMap<>();
            response.put("paymentUrl", paymentResult.get("paymentUrl"));
            response.put("vnp_TxnRef", paymentResult.get("vnp_TxnRef"));
            response.put("plan", paymentResult.get("plan"));
            
            logger.info("VNPay payment URL created successfully: {}", paymentResult.get("vnp_TxnRef"));
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error creating VNPay payment: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Xử lý IPN (Instant Payment Notification) từ VNPay
     */
    @GetMapping("/ipn")
    public ResponseEntity<?> handleIpn(HttpServletRequest request) {
        logger.info("=== VNPAY IPN REQUEST ===");
        
        try {
            // Get all parameters from request
            Map<String, String> allParams = new HashMap<>();
            request.getParameterMap().forEach((key, values) -> {
                if (values.length > 0) {
                    allParams.put(key, values[0]);
                }
            });
            
            logger.info("IPN parameters: {}", allParams);

            // Process IPN
            Map<String, String> ipnResponse = vnPayService.processIpn(allParams);
            
            // If payment is successful, update user plan
            if ("00".equals(ipnResponse.get("RspCode"))) {
                String vnp_TxnRef = allParams.get("vnp_TxnRef");
                String vnp_OrderInfo = allParams.get("vnp_OrderInfo");
                
                // Extract plan from order info or use default
                String plan = "PLUS";
                if (vnp_OrderInfo != null && vnp_OrderInfo.contains("PRO")) {
                    plan = "PRO";
                }
                
                logger.info("Payment successful for TxnRef: {}, updating user plan to: {}", vnp_TxnRef, plan);
                
                // Find user by email in order info
                if (vnp_OrderInfo != null && vnp_OrderInfo.contains("@")) {
                    String[] parts = vnp_OrderInfo.split(" - ");
                    if (parts.length > 1) {
                        String userEmail = parts[1];
                        User user = userRepository.findByEmail(userEmail).orElse(null);
                        if (user != null) {
                            planManagementService.updateUserPlan(user, plan);
                            logger.info("User plan updated to: {} for user: {}", plan, userEmail);
                        } else {
                            logger.warn("User not found for plan update: {}", userEmail);
                        }
                    }
                }
            }

            logger.info("IPN response: {}", ipnResponse);
            return ResponseEntity.ok(ipnResponse);

        } catch (Exception e) {
            logger.error("Error processing VNPay IPN: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("RspCode", "99");
            errorResponse.put("Message", "Unknown error");
            return ResponseEntity.ok(errorResponse);
        }
    }

    /**
     * Xử lý Return URL từ VNPay
     */
    @GetMapping("/return")
    public ResponseEntity<?> handleReturn(HttpServletRequest request) {
        logger.info("=== VNPAY RETURN URL REQUEST ===");
        
        try {
            // Get all parameters from request
            Map<String, String> allParams = new HashMap<>();
            request.getParameterMap().forEach((key, values) -> {
                if (values.length > 0) {
                    allParams.put(key, values[0]);
                }
            });
            
            logger.info("Return URL parameters: {}", allParams);

            // Process return URL
            Map<String, Object> returnResult = vnPayService.processReturnUrl(allParams);
            
            logger.info("Return URL processed: {}", returnResult);
            return ResponseEntity.ok(returnResult);

        } catch (Exception e) {
            logger.error("Error processing VNPay Return URL: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Unknown error");
            return ResponseEntity.ok(errorResponse);
        }
    }

    /**
     * Get client IP address
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedForHeader = request.getHeader("X-Forwarded-For");
        if (xForwardedForHeader == null) {
            return request.getRemoteAddr();
        } else {
            return xForwardedForHeader.split(",")[0];
        }
    }
}
