package com.shop.backend.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;

/**
 * Service để tạo link meeting cho các cuộc tư vấn trực tuyến
 */
@Service
public class MeetingLinkService {
    
    private static final SecureRandom random = new SecureRandom();
    
    /**
     * Tạo Google Meet link
     * Format: https://meet.google.com/xxx-xxxx-xxx
     */
    public String generateGoogleMeetLink() {
        // Tạo meeting code ngẫu nhiên (3 ký tự - 4 ký tự - 3 ký tự)
        String part1 = generateRandomString(3);
        String part2 = generateRandomString(4);
        String part3 = generateRandomString(3);
        
        return String.format("https://meet.google.com/%s-%s-%s", part1, part2, part3);
    }
    
    /**
     * Tạo Zoom link
     * Format: https://zoom.us/j/xxxxxxxxxx
     */
    public String generateZoomLink() {
        // Tạo meeting ID ngẫu nhiên (10 chữ số)
        String meetingId = generateRandomNumericString(10);
        
        return String.format("https://zoom.us/j/%s", meetingId);
    }
    
    /**
     * Tạo meeting link dựa trên loại (mặc định là Google Meet)
     * Có thể mở rộng để chọn loại meeting link
     */
    public String generateMeetingLink(String meetingType) {
        if ("ZOOM".equalsIgnoreCase(meetingType)) {
            return generateZoomLink();
        } else {
            // Mặc định dùng Google Meet
            return generateGoogleMeetLink();
        }
    }
    
    /**
     * Tạo meeting link mặc định (Google Meet)
     */
    public String generateMeetingLink() {
        return generateGoogleMeetLink();
    }
    
    /**
     * Tạo chuỗi ngẫu nhiên (chữ cái và số)
     */
    private String generateRandomString(int length) {
        String chars = "abcdefghijklmnopqrstuvwxyz";
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
    
    /**
     * Tạo chuỗi số ngẫu nhiên
     */
    private String generateRandomNumericString(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }
}

