package com.shop.backend.service;

import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {
    private static class OtpInfo {
        String otp;
        LocalDateTime expiresAt;
        OtpInfo(String otp, LocalDateTime expiresAt) {
            this.otp = otp;
            this.expiresAt = expiresAt;
        }
    }
    private final Map<String, OtpInfo> otpStore = new ConcurrentHashMap<>();

    public void saveOtp(String email, String otp, int minutes) {
        otpStore.put(email, new OtpInfo(otp, LocalDateTime.now().plusMinutes(minutes)));
    }

    public boolean verifyOtp(String email, String otp) {
        OtpInfo info = otpStore.get(email);
        if (info == null) return false;
        if (info.expiresAt.isBefore(LocalDateTime.now())) {
            otpStore.remove(email);
            return false;
        }
        boolean valid = info.otp.equals(otp);
        if (valid) otpStore.remove(email);
        return valid;
    }
} 