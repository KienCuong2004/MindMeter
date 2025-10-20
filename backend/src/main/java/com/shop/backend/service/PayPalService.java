package com.shop.backend.service;

import com.paypal.api.payments.*;
import com.paypal.base.rest.APIContext;
import com.paypal.base.rest.PayPalRESTException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

@Service
public class PayPalService {
    
    private static final Logger logger = Logger.getLogger(PayPalService.class.getName());
    
    @Value("${paypal.client.id}")
    private String clientId;
    
    @Value("${paypal.client.secret}")
    private String clientSecret;
    
    @Value("${paypal.mode}")
    private String mode;
    
    @Value("${app.payment.paypal.cancel-url}")
    private String cancelUrl;
    
    @Value("${app.payment.paypal.return-url}")
    private String returnUrl;
    
    private APIContext getAPIContext() {
        return new APIContext(clientId, clientSecret, mode);
    }
    
    /**
     * Create PayPal payment
     */
    public Map<String, String> createPayment(String plan, String currency, String description, String userEmail) throws PayPalRESTException {
        // Determine amount and plan details
        String planName = "Plus";
        BigDecimal amount = new BigDecimal("3.99");
        
        if ("pro".equalsIgnoreCase(plan)) {
            planName = "Pro";
            amount = new BigDecimal("9.99");
        }
        
        // Create payment details
        Details details = new Details();
        details.setSubtotal(String.format("%.2f", amount));
        
        Amount paymentAmount = new Amount();
        paymentAmount.setCurrency("USD");
        paymentAmount.setTotal(String.format("%.2f", amount));
        paymentAmount.setDetails(details);
        
        Transaction transaction = new Transaction();
        transaction.setAmount(paymentAmount);
        transaction.setDescription(description);
        
        // Add metadata
        List<Transaction> transactions = new ArrayList<>();
        transactions.add(transaction);
        
        Payer payer = new Payer();
        payer.setPaymentMethod("paypal");
        
        RedirectUrls redirectUrls = new RedirectUrls();
        redirectUrls.setCancelUrl(cancelUrl + "&plan=" + plan.toLowerCase());
        redirectUrls.setReturnUrl(returnUrl + "&plan=" + plan.toLowerCase());
        
        Payment payment = new Payment();
        payment.setIntent("sale");
        payment.setPayer(payer);
        payment.setTransactions(transactions);
        payment.setRedirectUrls(redirectUrls);
        
        // Create payment with retry logic
        Payment createdPayment = null;
        int maxRetries = 3;
        int retryDelay = 2000; // 2 seconds
        
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logger.info("Attempting to create PayPal payment (attempt " + attempt + "/" + maxRetries + ")");
                createdPayment = payment.create(getAPIContext());
                break;
            } catch (Exception e) {
                logger.warning("PayPal payment creation failed (attempt " + attempt + "/" + maxRetries + "): " + e.getMessage());
                if (attempt < maxRetries) {
                    try {
                        Thread.sleep(retryDelay * attempt); // Exponential backoff
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Payment creation interrupted", ie);
                    }
                } else {
                    throw new RuntimeException("Failed to create PayPal payment after " + maxRetries + " attempts: " + e.getMessage(), e);
                }
            }
        }
        
        if (createdPayment == null) {
            throw new RuntimeException("Failed to create PayPal payment");
        }
        
        // Find approval URL
        String approvalUrl = null;
        for (Links link : createdPayment.getLinks()) {
            if (link.getRel().equalsIgnoreCase("approval_url")) {
                approvalUrl = link.getHref();
                break;
            }
        }
        
        Map<String, String> result = new HashMap<>();
        result.put("paymentId", createdPayment.getId());
        result.put("approval_url", approvalUrl);
        result.put("plan", planName.toUpperCase());
        
        return result;
    }
    
    /**
     * Execute PayPal payment after approval
     */
    public Map<String, Object> executePayment(String paymentId, String payerId, String userEmail) throws PayPalRESTException {
        Payment payment = new Payment();
        payment.setId(paymentId);
        
        PaymentExecution paymentExecution = new PaymentExecution();
        paymentExecution.setPayerId(payerId);
        
        Payment executedPayment = payment.execute(getAPIContext(), paymentExecution);
        
        Map<String, Object> result = new HashMap<>();
        result.put("status", executedPayment.getState());
        result.put("paymentId", executedPayment.getId());
        
        if ("approved".equalsIgnoreCase(executedPayment.getState())) {
            // Extract plan from custom metadata or determine from amount
            String plan = "PLUS"; // Default
            if (executedPayment.getTransactions() != null && !executedPayment.getTransactions().isEmpty()) {
                Transaction transaction = executedPayment.getTransactions().get(0);
                String amount = transaction.getAmount().getTotal();
                if ("9.99".equals(amount)) {
                    plan = "PRO";
                }
            }
            result.put("plan", plan);
        }
        
        return result;
    }
    
    /**
     * Get payment details
     */
    public Payment getPaymentDetails(String paymentId) throws PayPalRESTException {
        return Payment.get(getAPIContext(), paymentId);
    }
}
