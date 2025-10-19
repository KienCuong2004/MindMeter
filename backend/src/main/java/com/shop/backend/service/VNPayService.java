package com.shop.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class VNPayService {

    private static final Logger logger = LoggerFactory.getLogger(VNPayService.class);

    @Value("${vnpay.tmnCode}")
    private String vnp_TmnCode;

    @Value("${vnpay.hashSecret}")
    private String vnp_HashSecret;

    @Value("${vnpay.payUrl}")
    private String vnp_PayUrl;

    @Value("${vnpay.returnUrl}")
    private String vnp_ReturnUrl;

    @Value("${vnpay.ipnUrl}")
    private String vnp_IpnUrl;

    /**
     * Tạo URL thanh toán VNPay
     */
    public Map<String, String> createPaymentUrl(String plan, String amount, String userEmail, String clientIp) {
        logger.info("Creating VNPay payment URL for plan: {}, amount: {}, user: {}", plan, amount, userEmail);

        try {
            String vnp_Version = "2.1.0";
            String vnp_Command = "pay";
            String vnp_TxnRef = getRandomNumber(8);
            String orderInfo = "Thanh toan MindMeter " + plan.toUpperCase() + " Plan - " + userEmail;
            String orderType = "other";
            
            // Convert USD to VND then to VNPay format
            // VNPay requires amount in VND, multiplied by 100 (no decimal places)
            // Example: $3.99 USD = 99,750 VND = 9,975,000 (VNPay format)
            double usdAmount = Double.parseDouble(amount);
            double vndAmount = usdAmount * 25000; // 1 USD = 25,000 VND
            long vnp_Amount = (long) (vndAmount * 100); // VNPay format
            
            // Create date
            Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
            SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
            String vnp_CreateDate = formatter.format(cld.getTime());
            
            // Expire date (15 minutes from now)
            cld.add(Calendar.MINUTE, 15);
            String vnp_ExpireDate = formatter.format(cld.getTime());

            // Build parameters
            Map<String, String> vnp_Params = new HashMap<>();
            vnp_Params.put("vnp_Version", vnp_Version);
            vnp_Params.put("vnp_Command", vnp_Command);
            vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
            vnp_Params.put("vnp_Amount", String.valueOf(vnp_Amount));
            vnp_Params.put("vnp_CurrCode", "VND");
            vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
            vnp_Params.put("vnp_OrderInfo", orderInfo);
            vnp_Params.put("vnp_OrderType", orderType);
            vnp_Params.put("vnp_Locale", "vn");
            vnp_Params.put("vnp_ReturnUrl", vnp_ReturnUrl + "?plan=" + plan.toLowerCase());
            vnp_Params.put("vnp_IpAddr", clientIp);
            vnp_Params.put("vnp_CreateDate", vnp_CreateDate);
            vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

            // Build query string and hash
            String queryUrl = buildQueryUrl(vnp_Params);
            String hashData = buildHashData(vnp_Params);
            String vnp_SecureHash = hmacSHA512(vnp_HashSecret, hashData);
            
            // Debug logs
            logger.info("VNPay hash data: {}", hashData);
            logger.info("VNPay secure hash: {}", vnp_SecureHash);
            logger.info("VNPay payment URL: {}", vnp_PayUrl + "?" + queryUrl);
            
            String paymentUrl = vnp_PayUrl + "?" + queryUrl + "&vnp_SecureHash=" + vnp_SecureHash;
            
            Map<String, String> result = new HashMap<>();
            result.put("paymentUrl", paymentUrl);
            result.put("vnp_TxnRef", vnp_TxnRef);
            result.put("plan", plan);
            result.put("amount", amount);
            
            logger.info("VNPay payment URL created successfully for TxnRef: {}", vnp_TxnRef);
            return result;
            
        } catch (Exception e) {
            logger.error("Error creating VNPay payment URL: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create VNPay payment URL", e);
        }
    }

    /**
     * Xử lý IPN (Instant Payment Notification) từ VNPay
     */
    public Map<String, String> processIpn(Map<String, String> allParams) {
        logger.info("Processing VNPay IPN with params: {}", allParams);

        try {
            String vnp_SecureHash = allParams.get("vnp_SecureHash");
            String vnp_TxnRef = allParams.get("vnp_TxnRef");
            String vnp_Amount = allParams.get("vnp_Amount");
            String vnp_ResponseCode = allParams.get("vnp_ResponseCode");
            String vnp_TransactionStatus = allParams.get("vnp_TransactionStatus");

            // Remove secure hash from params for verification
            Map<String, String> fields = new HashMap<>(allParams);
            fields.remove("vnp_SecureHash");
            fields.remove("vnp_SecureHashType");

            // Verify checksum
            String signValue = hashAllFields(fields);
            logger.info("VNPay return hash data: {}", signValue);
            logger.info("VNPay return received hash: {}", vnp_SecureHash);
            logger.info("VNPay return hash match: {}", signValue.equals(vnp_SecureHash));
            
            if (!signValue.equals(vnp_SecureHash)) {
                logger.error("Invalid checksum for IPN. Expected: {}, Actual: {}", signValue, vnp_SecureHash);
                return createIpnResponse("97", "Invalid Checksum");
            }

            // Check transaction status
            if ("00".equals(vnp_ResponseCode) && "00".equals(vnp_TransactionStatus)) {
                logger.info("VNPay payment successful for TxnRef: {}, Amount: {}", vnp_TxnRef, vnp_Amount);
                return createIpnResponse("00", "Confirm Success");
            } else {
                logger.warn("VNPay payment failed for TxnRef: {}, ResponseCode: {}, TransactionStatus: {}", 
                    vnp_TxnRef, vnp_ResponseCode, vnp_TransactionStatus);
                return createIpnResponse("02", "Payment Failed");
            }

        } catch (Exception e) {
            logger.error("Error processing VNPay IPN: {}", e.getMessage(), e);
            return createIpnResponse("99", "Unknown error");
        }
    }

    /**
     * Xử lý Return URL từ VNPay
     */
    public Map<String, Object> processReturnUrl(Map<String, String> allParams) {
        logger.info("Processing VNPay Return URL with params: {}", allParams);

        try {
            String vnp_SecureHash = allParams.get("vnp_SecureHash");
            String vnp_ResponseCode = allParams.get("vnp_ResponseCode");
            String vnp_TxnRef = allParams.get("vnp_TxnRef");
            String plan = allParams.get("plan");

            // Remove secure hash and custom params from params for verification
            Map<String, String> fields = new HashMap<>(allParams);
            fields.remove("vnp_SecureHash");
            fields.remove("vnp_SecureHashType");
            fields.remove("plan"); // Remove custom plan parameter

            // Verify checksum
            String signValue = hashAllFields(fields);
            boolean isValidChecksum = signValue.equals(vnp_SecureHash);
            
            logger.info("VNPay return hash data: {}", signValue);
            logger.info("VNPay return received hash: {}", vnp_SecureHash);
            logger.info("VNPay return hash match: {}", isValidChecksum);

            Map<String, Object> result = new HashMap<>();
            result.put("success", isValidChecksum && "00".equals(vnp_ResponseCode));
            result.put("vnp_TxnRef", vnp_TxnRef);
            result.put("vnp_ResponseCode", vnp_ResponseCode);
            result.put("plan", plan);
            result.put("message", isValidChecksum ? 
                ("00".equals(vnp_ResponseCode) ? "GD Thanh cong" : "GD Khong thanh cong") : 
                "Chu ky khong hop le");

            logger.info("VNPay Return URL processed: success={}, TxnRef={}", 
                result.get("success"), vnp_TxnRef);

            return result;

        } catch (Exception e) {
            logger.error("Error processing VNPay Return URL: {}", e.getMessage(), e);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "Unknown error");
            return result;
        }
    }

    /**
     * Tạo response cho IPN
     */
    private Map<String, String> createIpnResponse(String rspCode, String message) {
        Map<String, String> response = new HashMap<>();
        response.put("RspCode", rspCode);
        response.put("Message", message);
        return response;
    }

    /**
     * Build hash data for checksum calculation
     */
    private String buildHashData(Map<String, String> vnp_Params) throws UnsupportedEncodingException {
        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        
        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if (fieldValue != null && fieldValue.length() > 0) {
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8.toString()));
                if (itr.hasNext()) {
                    hashData.append('&');
                }
            }
        }
        
        return hashData.toString();
    }

    /**
     * Build query URL from parameters
     */
    private String buildQueryUrl(Map<String, String> vnp_Params) throws UnsupportedEncodingException {
        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if (fieldValue != null && fieldValue.length() > 0) {
                // Build query
                query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8.toString()));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8.toString()));
                
                if (itr.hasNext()) {
                    query.append('&');
                }
            }
        }
        
        return query.toString();
    }

    /**
     * Hash all fields for checksum verification
     */
    private String hashAllFields(Map<String, String> fields) throws UnsupportedEncodingException {
        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        
        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = fields.get(fieldName);
            if (fieldValue != null && fieldValue.length() > 0) {
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(fieldValue);
                if (itr.hasNext()) {
                    hashData.append('&');
                }
            }
        }
        
        return hashData.toString();
    }

    /**
     * Generate HMAC SHA512 hash
     */
    private String hmacSHA512(String key, String data) throws NoSuchAlgorithmException, InvalidKeyException, UnsupportedEncodingException {
        Mac sha512_HMAC = Mac.getInstance("HmacSHA512");
        SecretKeySpec secret_key = new SecretKeySpec(key.getBytes("UTF-8"), "HmacSHA512");
        sha512_HMAC.init(secret_key);
        
        byte[] hash = sha512_HMAC.doFinal(data.getBytes("UTF-8"));
        StringBuilder result = new StringBuilder();
        for (byte b : hash) {
            result.append(String.format("%02x", b));
        }
        
        return result.toString();
    }
    

    /**
     * Generate random number for transaction reference
     */
    private String getRandomNumber(int len) {
        Random rnd = new Random();
        String chars = "0123456789";
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
