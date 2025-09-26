package com.shop.backend.controller;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;
import com.shop.backend.repository.UserRepository;
import com.shop.backend.model.User;
import com.shop.backend.service.PlanManagementService;
import com.shop.backend.service.RateLimitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import java.util.logging.Logger;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.fasterxml.jackson.databind.JsonNode;
import com.shop.backend.security.JwtService;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {
    private static final Logger logger = Logger.getLogger(PaymentController.class.getName());
    
    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    @Value("${app.base.url:http://localhost:3000}")
    private String appBaseUrl;

    @Value("${app.backend.url:http://localhost:8080}")
    private String backendBaseUrl;

    @Value("${stripe.mode:test}")
    private String stripeMode;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
        logger.info("Stripe initialized in " + stripeMode.toUpperCase() + " mode");
        logger.info("Using API Key: " + stripeApiKey.substring(0, Math.min(20, stripeApiKey.length())) + "...");
    }

    // Helper method để lấy URLs
    private String getSuccessUrl() {
        return appBaseUrl + "/pricing?success=true";
    }

    private String getCancelUrl() {
        return appBaseUrl + "/pricing?canceled=true";
    }

    private String getWebhookUrl() {
        return backendBaseUrl + "/api/payment/webhook";
    }

    // Method để kiểm tra rate limit
    private boolean isRateLimited(String userEmail) {
        // Use the centralized rate limit service
        return rateLimitService.isPaymentRateLimited(userEmail);
    }

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlanManagementService planManagementService;

    @Autowired
    private RateLimitService rateLimitService;

    @Autowired
    private JwtService jwtService;

    @PostConstruct
    public void validateStripeConfiguration() {
        if (webhookSecret == null || webhookSecret.trim().isEmpty()) {
            logger.warning("Stripe webhook secret is not configured! Webhook signature verification will be disabled.");
        } else {
            logger.info("Stripe webhook secret configured successfully");
        }
    }

    // Endpoint để kiểm tra Stripe mode
    @GetMapping("/stripe-status")
    public ResponseEntity<?> getStripeStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("mode", stripeMode);
        status.put("apiKeyPrefix", stripeApiKey.substring(0, Math.min(10, stripeApiKey.length())));
        status.put("isTestMode", "test".equalsIgnoreCase(stripeMode));
        status.put("isProductionMode", "prod".equalsIgnoreCase(stripeMode));
        status.put("webhookUrl", getWebhookUrl());
        status.put("successUrl", getSuccessUrl());
        status.put("cancelUrl", getCancelUrl());
        
        return ResponseEntity.ok(status);
    }

    @PostMapping("/create-checkout-session")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createCheckoutSession(@RequestBody Map<String, Object> payload, @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        String userEmail = userDetails.getUsername();
        
        // Kiểm tra rate limit
        if (isRateLimited(userEmail)) {
            logger.warning("Rate limit exceeded for user: " + userEmail);
            return ResponseEntity.status(429).body(Map.of(
                "error", "Rate limit exceeded. Please try again later.",
                "retryAfter", 60 // seconds
            ));
        }
        
        String plan = (String) payload.getOrDefault("plan", "plus");
        long amount = 399;
        String planName = "Plus";
        if ("pro".equalsIgnoreCase(plan)) {
            amount = 999;
            planName = "Pro";
        }
        
        // Lấy user hiện tại để lưu ID vào metadata
        User currentUser = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        if (currentUser == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }
        
        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(getSuccessUrl())
                .setCancelUrl(getCancelUrl())
                .putMetadata("plan", planName.toUpperCase())
                .putMetadata("userId", currentUser.getId().toString())
                .putMetadata("userEmail", currentUser.getEmail())
                .putMetadata("amount", String.valueOf(amount))
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency("usd")
                                                .setUnitAmount(amount)
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName(planName + " Plan")
                                                                .setDescription("MindMeter " + planName + " Subscription Plan")
                                                                .build()
                                                )
                                                .build()
                                )
                                .build()
                )
                .build();
        try {
            Session session = Session.create(params);
            Map<String, String> resp = new HashMap<>();
            resp.put("url", session.getUrl());
            return ResponseEntity.ok(resp);
        } catch (StripeException e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleStripeWebhook(@RequestBody String payload, @RequestHeader("Stripe-Signature") String sigHeader) {
        logger.info("=== WEBHOOK RECEIVED ===");
        logger.info("Stripe Mode: " + stripeMode.toUpperCase());
        logger.info("Webhook Secret: " + (webhookSecret != null ? webhookSecret.substring(0, Math.min(10, webhookSecret.length())) + "..." : "NULL"));
        logger.info("Payload length: " + payload.length());
        logger.info("Signature header: " + (sigHeader != null ? sigHeader.substring(0, Math.min(20, sigHeader.length())) + "..." : "NULL"));
        
        Event event = null;
        try {
            if (webhookSecret != null && !webhookSecret.isEmpty()) {
                event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
                logger.info("Webhook signature verified successfully");
            } else {
                ObjectMapper mapper = new ObjectMapper();
                event = mapper.readValue(payload, Event.class);
                logger.info("Webhook processed without signature verification");
            }
        } catch (Exception e) {
            logger.severe("Webhook signature verification failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Webhook error: " + e.getMessage());
        }
        
        logger.info("Webhook event type: " + event.getType());
        logger.info("Webhook event ID: " + event.getId());
        
        // Debug: Kiểm tra event data
        if (event.getData() != null) {
            logger.info("Event data is not null");
            var deserializer = event.getDataObjectDeserializer();
            logger.info("Deserializer: " + deserializer);
            
            if (deserializer.getObject().isPresent()) {
                logger.info("Object is present in deserializer");
                com.stripe.model.StripeObject stripeObject = deserializer.getObject().get();
                logger.info("Stripe object type: " + stripeObject.getClass().getSimpleName());
                logger.info("Stripe object class: " + stripeObject.getClass().getName());
            } else {
                logger.warning("Object is NOT present in deserializer");
                // Thử parse payload trực tiếp
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    JsonNode jsonNode = mapper.readTree(payload);
                    if (jsonNode.has("data") && jsonNode.get("data").has("object")) {
                        JsonNode objectNode = jsonNode.get("data").get("object");
                        logger.info("Found object in raw JSON: " + objectNode.get("id").asText());
                        logger.info("Object type: " + objectNode.get("object").asText());
                        
                        // Xử lý dựa trên object type
                        String objectType = objectNode.get("object").asText();
                        if ("checkout.session".equals(objectType)) {
                            processRawSessionData(objectNode);
                        } else if ("payment_intent".equals(objectType)) {
                            processRawPaymentIntentData(objectNode);
                        }
                    }
                } catch (Exception e) {
                    logger.severe("Error parsing raw JSON: " + e.getMessage());
                }
            }
        } else {
            logger.warning("Event data is null");
        }
        
        // Xử lý cả checkout.session.completed và payment_intent.succeeded
        if ("checkout.session.completed".equals(event.getType())) {
            logger.info("Processing checkout.session.completed event");
            Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
            if (session != null) {
                processPaymentSuccess(session, "checkout.session.completed");
            } else {
                logger.warning("Session object is null in webhook");
                handleNullSessionFallback(event, "checkout.session.completed");
            }
        } else if ("payment_intent.succeeded".equals(event.getType())) {
            logger.info("Processing payment_intent.succeeded event");
            com.stripe.model.PaymentIntent paymentIntent = (com.stripe.model.PaymentIntent) event.getDataObjectDeserializer().getObject().orElse(null);
            if (paymentIntent != null) {
                logger.info("Payment Intent ID: " + paymentIntent.getId());
                logger.info("Payment Intent metadata: " + paymentIntent.getMetadata());
                logger.info("Payment Intent amount: " + paymentIntent.getAmount());
                logger.info("Payment Intent currency: " + paymentIntent.getCurrency());
                
                // Thử lấy session từ payment intent metadata
                if (paymentIntent.getMetadata() != null && paymentIntent.getMetadata().containsKey("session_id")) {
                    String sessionId = paymentIntent.getMetadata().get("session_id");
                    try {
                        Session session = Session.retrieve(sessionId);
                        logger.info("Retrieved session from payment intent: " + session.getId());
                        processPaymentSuccess(session, "payment_intent.succeeded");
                    } catch (StripeException e) {
                        logger.severe("Error retrieving session from payment intent: " + e.getMessage());
                        // Fallback: xử lý trực tiếp từ payment intent
                        processPaymentIntentSuccess(paymentIntent);
                    }
                } else {
                    // Nếu không có session_id, thử tìm session bằng cách khác
                    logger.info("No session_id found in payment intent metadata, trying alternative approach");
                    
                    // Thử tìm session dựa trên amount và thời gian
                    try {
                        // Lấy danh sách sessions gần đây và tìm session phù hợp
                        Map<String, Object> sessionParams = new HashMap<>();
                        sessionParams.put("limit", 10);
                        com.stripe.model.StripeCollection<Session> sessions = Session.list(sessionParams);
                        
                        Session matchingSession = null;
                        for (Session session : sessions.getData()) {
                            if (session.getAmountTotal() != null && 
                                session.getAmountTotal().equals(paymentIntent.getAmount()) &&
                                session.getCurrency().equals(paymentIntent.getCurrency()) &&
                                session.getMetadata() != null &&
                                session.getMetadata().containsKey("userId")) {
                                
                                // Kiểm tra thời gian (session phải được tạo gần đây)
                                long sessionTime = session.getCreated();
                                long paymentTime = paymentIntent.getCreated();
                                if (Math.abs(sessionTime - paymentTime) < 300000) { // 5 phút
                                    matchingSession = session;
                                    break;
                                }
                            }
                        }
                        
                        if (matchingSession != null) {
                            logger.info("Found matching session: " + matchingSession.getId());
                            processPaymentSuccess(matchingSession, "payment_intent.succeeded (matched)");
                        } else {
                            logger.warning("No matching session found, processing payment intent directly");
                            processPaymentIntentSuccess(paymentIntent);
                        }
                    } catch (StripeException e) {
                        logger.severe("Error searching for matching session: " + e.getMessage());
                        // Fallback: xử lý trực tiếp từ payment intent
                        processPaymentIntentSuccess(paymentIntent);
                    }
                }
            } else {
                logger.warning("Payment Intent object is null in webhook");
                handleNullPaymentIntentFallback(event, "payment_intent.succeeded");
            }
        } else if ("payment_intent.created".equals(event.getType())) {
            logger.info("Processing payment_intent.created event");
            com.stripe.model.PaymentIntent paymentIntent = (com.stripe.model.PaymentIntent) event.getDataObjectDeserializer().getObject().orElse(null);
            if (paymentIntent != null) {
                logger.info("Payment Intent created - ID: " + paymentIntent.getId());
                logger.info("Payment Intent created - Amount: " + paymentIntent.getAmount());
                logger.info("Payment Intent created - Currency: " + paymentIntent.getCurrency());
                logger.info("Payment Intent created - Status: " + paymentIntent.getStatus());
                
                // Với payment_intent.created, chúng ta chỉ log thông tin
                // Không cập nhật plan vì thanh toán chưa hoàn thành
                logger.info("Payment Intent created successfully - waiting for payment completion");
            } else {
                logger.warning("Payment Intent object is null in payment_intent.created webhook");
                handleNullPaymentIntentFallback(event, "payment_intent.created");
            }
        } else {
            logger.info("Event type not handled: " + event.getType());
        }
        return ResponseEntity.ok("success");
    }

    // Helper method để xử lý thanh toán thành công từ session
    private void processPaymentSuccess(Session session, String eventType) {
        logger.info("Processing payment success from " + eventType + " for session: " + session.getId());
        logger.info("Session metadata: " + session.getMetadata());
        
        String plan = "PLUS";
        Long userId = null;
        
        try {
            // Lấy plan và userId từ metadata
            if (session.getMetadata() != null) {
                if (session.getMetadata().containsKey("plan")) {
                    plan = session.getMetadata().get("plan");
                    if (plan == null || plan.isEmpty()) plan = "PLUS";
                    plan = plan.toUpperCase();
                    logger.info("Plan from metadata: " + plan);
                }
                if (session.getMetadata().containsKey("userId")) {
                    userId = Long.parseLong(session.getMetadata().get("userId"));
                    logger.info("User ID from metadata: " + userId);
                }
            }
        } catch (Exception e) {
            logger.warning("Error parsing metadata: " + e.getMessage());
        }
        
        if (userId != null) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                logger.info("Found user: " + user.getEmail() + ", current plan: " + user.getPlan());
                logger.info("Updating user plan from " + user.getPlan() + " to " + plan + " for user ID: " + userId);
                
                // Sử dụng PlanManagementService để cập nhật plan với expiry date
                planManagementService.updateUserPlan(user, plan);
                
                // Refresh user từ database để lấy thông tin mới nhất
                user = userRepository.findById(userId).orElse(null);
                if (user != null) {
                    logger.info("User plan updated successfully to: " + user.getPlan() + " with expiry date: " + user.getPlanExpiryDate());
                }
            } else {
                logger.warning("User not found for ID: " + userId);
            }
        } else {
            logger.warning("User ID is null in session metadata");
        }
    }

    // Helper method để xử lý thanh toán thành công từ payment intent
    private void processPaymentIntentSuccess(com.stripe.model.PaymentIntent paymentIntent) {
        logger.info("Processing payment intent success directly for: " + paymentIntent.getId());
        logger.info("Payment Intent metadata: " + paymentIntent.getMetadata());
        
        String plan = "PLUS";
        Long userId = null;
        
        try {
            // Lấy plan và userId từ payment intent metadata
            if (paymentIntent.getMetadata() != null) {
                if (paymentIntent.getMetadata().containsKey("plan")) {
                    plan = paymentIntent.getMetadata().get("plan");
                    if (plan == null || plan.isEmpty()) plan = "PLUS";
                    plan = plan.toUpperCase();
                    logger.info("Plan from payment intent metadata: " + plan);
                }
                if (paymentIntent.getMetadata().containsKey("userId")) {
                    userId = Long.parseLong(paymentIntent.getMetadata().get("userId"));
                    logger.info("User ID from payment intent metadata: " + userId);
                }
            }
            
            // Nếu không có userId từ metadata, thử tìm user dựa trên amount
            if (userId == null) {
                logger.info("No userId in metadata, trying to determine plan from amount");
                long amount = paymentIntent.getAmount();
                if (amount == 399) {
                    plan = "PLUS";
                    logger.info("Determined plan PLUS from amount: " + amount);
                } else if (amount == 999) {
                    plan = "PRO";
                    logger.info("Determined plan PRO from amount: " + amount);
                } else {
                    logger.warning("Unknown amount: " + amount + ", using default plan PLUS");
                    plan = "PLUS";
                }
                
                // Tìm user dựa trên email nếu có
                if (paymentIntent.getReceiptEmail() != null) {
                    User user = userRepository.findByEmail(paymentIntent.getReceiptEmail()).orElse(null);
                    if (user != null) {
                        userId = user.getId();
                        logger.info("Found user by email: " + user.getEmail() + " with ID: " + userId);
                    }
                }
            }
            
        } catch (Exception e) {
            logger.warning("Error parsing payment intent metadata: " + e.getMessage());
        }
        
        if (userId != null) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                logger.info("Found user: " + user.getEmail() + ", current plan: " + user.getPlan());
                logger.info("Updating user plan from " + user.getPlan() + " to " + plan + " for user ID: " + userId);
                
                // Sử dụng PlanManagementService để cập nhật plan với expiry date
                planManagementService.updateUserPlan(user, plan);
                
                // Refresh user từ database để lấy thông tin mới nhất
                user = userRepository.findById(userId).orElse(null);
                if (user != null) {
                    logger.info("User plan updated successfully to: " + user.getPlan() + " with expiry date: " + user.getPlanExpiryDate());
                }
            } else {
                logger.warning("User not found for ID: " + userId);
            }
        } else {
            logger.warning("Could not determine user ID from payment intent. Payment Intent ID: " + paymentIntent.getId() + ", Amount: " + paymentIntent.getAmount());
            // Log thêm thông tin để debug
            logger.warning("Payment Intent Details - Email: " + paymentIntent.getReceiptEmail() + ", Currency: " + paymentIntent.getCurrency() + ", Status: " + paymentIntent.getStatus());
        }
    }

    // Method fallback để xử lý trường hợp Session object bị null
    private void handleNullSessionFallback(Event event, String eventType) {
        logger.warning("Handling null session fallback for event type: " + eventType);
        
        try {
            // Thử lấy thông tin từ event data
            if (event.getData() != null) {
                // Sử dụng getDataObjectDeserializer() thay vì getObject() deprecated
                var deserializer = event.getDataObjectDeserializer();
                if (deserializer.getObject().isPresent()) {
                    Session session = (Session) deserializer.getObject().get();
                    if (session != null) {
                        logger.info("Successfully retrieved session in fallback: " + session.getId());
                        processPaymentSuccess(session, eventType + " (fallback)");
                        return;
                    }
                }
            }
            
            // Nếu không thể lấy session, thử xử lý dựa trên event metadata
            logger.info("Attempting to process event metadata as fallback");
            processEventMetadataFallback(event, eventType);
            
        } catch (Exception e) {
            logger.severe("Error in session fallback handler: " + e.getMessage());
        }
    }

    // Method fallback để xử lý trường hợp Payment Intent object bị null
    private void handleNullPaymentIntentFallback(Event event, String eventType) {
        logger.warning("Handling null payment intent fallback for event type: " + eventType);
        
        try {
            // Thử lấy thông tin từ event data
            if (event.getData() != null) {
                // Sử dụng getDataObjectDeserializer() thay vì getObject() deprecated
                var deserializer = event.getDataObjectDeserializer();
                if (deserializer.getObject().isPresent()) {
                    com.stripe.model.PaymentIntent paymentIntent = (com.stripe.model.PaymentIntent) deserializer.getObject().get();
                    if (paymentIntent != null) {
                        logger.info("Successfully retrieved payment intent in fallback: " + paymentIntent.getId());
                        processPaymentIntentSuccess(paymentIntent);
                        return;
                    }
                }
            }
            
            // Nếu không thể lấy payment intent, thử xử lý dựa trên event metadata
            logger.info("Attempting to process event metadata as fallback");
            processEventMetadataFallback(event, eventType);
            
        } catch (Exception e) {
            logger.severe("Error in payment intent fallback handler: " + e.getMessage());
        }
    }

    // Method fallback chung để xử lý dựa trên event metadata
    private void processEventMetadataFallback(Event event, String eventType) {
        logger.info("Processing event metadata fallback for event type: " + eventType);
        
        try {
            // Thử lấy thông tin từ event data
            if (event.getData() != null) {
                var deserializer = event.getDataObjectDeserializer();
                if (deserializer.getObject().isPresent()) {
                    com.stripe.model.StripeObject stripeObject = deserializer.getObject().get();
                    
                    // Thử lấy thông tin từ các trường có thể có
                    logger.info("Event object type: " + stripeObject.getClass().getSimpleName());
                    
                    // Thử tìm user dựa trên email nếu có
                    String userEmail = null;
                    try {
                        // Sử dụng instanceof để kiểm tra và cast an toàn
                        if (stripeObject instanceof com.stripe.model.PaymentIntent) {
                            com.stripe.model.PaymentIntent pi = (com.stripe.model.PaymentIntent) stripeObject;
                            userEmail = pi.getReceiptEmail();
                            logger.info("Extracted email from PaymentIntent: " + userEmail);
                        } else if (stripeObject instanceof Session) {
                            Session session = (Session) stripeObject;
                            if (session.getCustomerDetails() != null) {
                                userEmail = session.getCustomerDetails().getEmail();
                                logger.info("Extracted email from Session: " + userEmail);
                            }
                        }
                    } catch (Exception e) {
                        logger.warning("Could not extract email from stripe object: " + e.getMessage());
                    }
                    
                    if (userEmail != null) {
                        logger.info("Found user email in fallback: " + userEmail);
                        User user = userRepository.findByEmail(userEmail).orElse(null);
                        if (user != null) {
                            logger.info("Found user by email: " + user.getEmail());
                            
                            // Thử xác định plan dựa trên amount nếu có
                            String plan = determinePlanFromEvent(event);
                            if (plan != null) {
                                logger.info("Determined plan from event: " + plan);
                                planManagementService.updateUserPlan(user, plan);
                                logger.info("User plan updated successfully in fallback to: " + plan);
                            } else {
                                logger.warning("Could not determine plan from event, using default PLUS");
                                planManagementService.updateUserPlan(user, "PLUS");
                            }
                        } else {
                            logger.warning("User not found for email: " + userEmail);
                        }
                    } else {
                        logger.warning("No user email found in event metadata fallback");
                    }
                } else {
                    logger.warning("No object found in event deserializer");
                }
            }
        } catch (Exception e) {
            logger.severe("Error in event metadata fallback: " + e.getMessage());
        }
    }

    // Method để xác định plan từ event data
    private String determinePlanFromEvent(Event event) {
        try {
            if (event.getData() != null) {
                var deserializer = event.getDataObjectDeserializer();
                if (deserializer.getObject().isPresent()) {
                    com.stripe.model.StripeObject stripeObject = deserializer.getObject().get();
                    
                    // Thử lấy amount từ payment intent
                    if (stripeObject instanceof com.stripe.model.PaymentIntent) {
                        com.stripe.model.PaymentIntent pi = (com.stripe.model.PaymentIntent) stripeObject;
                        Long amount = pi.getAmount();
                        if (amount != null) {
                            if (amount == 399) return "PLUS";
                            if (amount == 999) return "PRO";
                        }
                    }
                    
                    // Thử lấy amount từ session
                    if (stripeObject instanceof Session) {
                        Session session = (Session) stripeObject;
                        Long amount = session.getAmountTotal();
                        if (amount != null) {
                            if (amount == 399) return "PLUS";
                            if (amount == 999) return "PRO";
                        }
                    }
                    
                    // Thử lấy từ metadata
                    if (stripeObject instanceof com.stripe.model.PaymentIntent) {
                        com.stripe.model.PaymentIntent pi = (com.stripe.model.PaymentIntent) stripeObject;
                        if (pi.getMetadata() != null && pi.getMetadata().containsKey("plan")) {
                            String plan = pi.getMetadata().get("plan");
                            if (plan != null && !plan.isEmpty()) {
                                return plan.toUpperCase();
                            }
                        }
                    }
                    
                    if (stripeObject instanceof Session) {
                        Session session = (Session) stripeObject;
                        if (session.getMetadata() != null && session.getMetadata().containsKey("plan")) {
                            String plan = session.getMetadata().get("plan");
                            if (plan != null && !plan.isEmpty()) {
                                return plan.toUpperCase();
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.warning("Error determining plan from event: " + e.getMessage());
        }
        
        return null;
    }

    // Method để xử lý raw session data từ JSON
    private void processRawSessionData(JsonNode sessionNode) {
        try {
            logger.info("Processing raw session data");
            
            // Lấy thông tin từ session
            String sessionId = sessionNode.get("id").asText();
            String customerEmail = null;
            if (sessionNode.has("customer_details") && sessionNode.get("customer_details").has("email")) {
                customerEmail = sessionNode.get("customer_details").get("email").asText();
            }
            
            // Lấy metadata
            String plan = "PLUS";
            Long userId = null;
            if (sessionNode.has("metadata")) {
                JsonNode metadata = sessionNode.get("metadata");
                if (metadata.has("plan")) {
                    plan = metadata.get("plan").asText();
                }
                if (metadata.has("userId")) {
                    userId = Long.parseLong(metadata.get("userId").asText());
                }
            }
            
            logger.info("Raw session - ID: " + sessionId + ", Plan: " + plan + ", UserId: " + userId + ", Email: " + customerEmail);
            
            // Cập nhật plan cho user
            if (userId != null) {
                User user = userRepository.findById(userId).orElse(null);
                if (user != null) {
                    logger.info("Found user by ID: " + user.getEmail());
                    planManagementService.updateUserPlan(user, plan);
                    logger.info("User plan updated successfully to: " + plan);
                }
            } else if (customerEmail != null) {
                User user = userRepository.findByEmail(customerEmail).orElse(null);
                if (user != null) {
                    logger.info("Found user by email: " + user.getEmail());
                    planManagementService.updateUserPlan(user, plan);
                    logger.info("User plan updated successfully to: " + plan);
                }
            }
            
        } catch (Exception e) {
            logger.severe("Error processing raw session data: " + e.getMessage());
        }
    }

    // Method để xử lý raw payment intent data từ JSON
    private void processRawPaymentIntentData(JsonNode paymentIntentNode) {
        try {
            logger.info("Processing raw payment intent data");
            
            // Lấy thông tin từ payment intent
            String paymentIntentId = paymentIntentNode.get("id").asText();
            Long amount = paymentIntentNode.get("amount").asLong();
            String customerEmail = null;
            if (paymentIntentNode.has("receipt_email")) {
                customerEmail = paymentIntentNode.get("receipt_email").asText();
            }
            
            // Xác định plan từ amount
            String plan = "PLUS";
            if (amount == 399) {
                plan = "PLUS";
            } else if (amount == 999) {
                plan = "PRO";
            }
            
            logger.info("Raw payment intent - ID: " + paymentIntentId + ", Amount: " + amount + ", Plan: " + plan + ", Email: " + customerEmail);
            
            // Cập nhật plan cho user
            if (customerEmail != null) {
                User user = userRepository.findByEmail(customerEmail).orElse(null);
                if (user != null) {
                    logger.info("Found user by email: " + user.getEmail());
                    planManagementService.updateUserPlan(user, plan);
                    logger.info("User plan updated successfully to: " + plan);
                }
            }
            
        } catch (Exception e) {
            logger.severe("Error processing raw payment intent data: " + e.getMessage());
        }
    }

    // Endpoint để test webhook (chỉ dành cho development)
    @PostMapping("/test-webhook")
    // @PreAuthorize("isAuthenticated()") // Tạm thời comment để test
    public ResponseEntity<String> testWebhook(@RequestBody Map<String, Object> payload) {
        logger.info("Testing webhook with payload: " + payload);
        
        // Simulate webhook event
        String plan = (String) payload.getOrDefault("plan", "PLUS");
        Long userId = (Long) payload.getOrDefault("userId", 1L);
        
        logger.info("Testing plan update: " + plan + " for user ID: " + userId);
        
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            logger.info("Found user: " + user.getEmail() + ", current plan: " + user.getPlan());
            planManagementService.updateUserPlan(user, plan);
            logger.info("User plan updated successfully to: " + user.getPlan());
            return ResponseEntity.ok("Test webhook successful. User plan updated to: " + user.getPlan());
        } else {
            return ResponseEntity.badRequest().body("User not found for ID: " + userId);
        }
    }

    // Endpoint test đơn giản (không gọi service)
    @PostMapping("/test-simple")
    public ResponseEntity<String> testSimple(@RequestBody Map<String, Object> payload) {
        logger.info("Simple test endpoint called with payload: " + payload);
        return ResponseEntity.ok("Simple test successful! Received: " + payload);
    }

    // Endpoint để test payment_intent.succeeded webhook (chỉ dành cho development)
    @PostMapping("/test-payment-intent")
    // @PreAuthorize("isAuthenticated()") // Tạm thời comment để test
    public ResponseEntity<String> testPaymentIntentWebhook(@RequestBody Map<String, Object> payload) {
        logger.info("Testing payment_intent.succeeded webhook with payload: " + payload);
        
        // Simulate payment_intent.succeeded event
        String plan = (String) payload.getOrDefault("plan", "PLUS");
        Long userId = (Long) payload.getOrDefault("userId", 1L);
        Long amount = (Long) payload.getOrDefault("amount", 399L);
        String email = (String) payload.getOrDefault("email", "test@example.com");
        
        logger.info("Testing payment intent success: plan=" + plan + ", userId=" + userId + ", amount=" + amount + ", email=" + email);
        
        // Tạo mock PaymentIntent object để test
        try {
            // Tạo một mock payment intent với metadata
            Map<String, String> metadata = new HashMap<>();
            metadata.put("plan", plan);
            metadata.put("userId", userId.toString());
            
            // Test với user thật
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                logger.info("Found user: " + user.getEmail() + ", current plan: " + user.getPlan());
                
                // Cập nhật plan
                planManagementService.updateUserPlan(user, plan);
                
                // Refresh user
                user = userRepository.findById(userId).orElse(null);
                if (user != null) {
                    logger.info("User plan updated successfully to: " + user.getPlan());
                    return ResponseEntity.ok("Test payment_intent.succeeded successful. User plan updated to: " + user.getPlan());
                }
            } else {
                return ResponseEntity.badRequest().body("User not found for ID: " + userId);
            }
        } catch (Exception e) {
            logger.severe("Error testing payment intent webhook: " + e.getMessage());
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
        
        return ResponseEntity.ok("Test completed");
    }

    // API endpoint để frontend fetch user profile mới sau khi thanh toán
    @GetMapping("/user-profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getUserProfile(@AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        try {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
            if (user != null) {
                Map<String, Object> profile = new HashMap<>();
                profile.put("email", user.getEmail());
                profile.put("role", user.getRole().toString());
                profile.put("firstName", user.getFirstName());
                profile.put("lastName", user.getLastName());
                profile.put("plan", user.getPlan());
                profile.put("phone", user.getPhone());
                profile.put("avatarUrl", user.getAvatarUrl());
                profile.put("planStartDate", user.getPlanStartDate());
                profile.put("planExpiryDate", user.getPlanExpiryDate());
                profile.put("createdAt", user.getCreatedAt());
                profile.put("updatedAt", user.getUpdatedAt());
                
                logger.info("Returning user profile for " + user.getEmail() + " with plan: " + user.getPlan());
                return ResponseEntity.ok(profile);
            } else {
                logger.warning("User not found for email: " + userDetails.getUsername());
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.severe("Error fetching user profile: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error"));
        }
    }
    
    @PostMapping("/refresh-token")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> refreshPaymentToken(@AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        try {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
            if (user != null) {
                // Tạo JWT token mới với thông tin đã cập nhật
                String newToken = jwtService.generateTokenWithUserInfo(user);
                
                // Trả về token mới và thông tin user
                Map<String, Object> response = new HashMap<>();
                response.put("token", newToken);
                
                // Tạo user object với xử lý null an toàn
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