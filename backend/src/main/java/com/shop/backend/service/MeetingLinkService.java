package com.shop.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

/**
 * Service để tạo link meeting cho các cuộc tư vấn trực tuyến
 * Ưu tiên sử dụng Google Calendar API để tạo link thật, fallback về link giả nếu không có
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MeetingLinkService {
    
    private static final SecureRandom random = new SecureRandom();
    private final GoogleCalendarService googleCalendarService;
    
    /**
     * Tạo Google Meet link
     * Ưu tiên sử dụng Google Calendar API, nếu không có thì tạo link giả
     * 
     * @param summary Tiêu đề cuộc họp (cho Google Calendar API)
     * @param startTime Thời gian bắt đầu (cho Google Calendar API)
     * @param endTime Thời gian kết thúc (cho Google Calendar API)
     * @param timeZone Múi giờ (cho Google Calendar API, mặc định: "Asia/Ho_Chi_Minh")
     * @param description Mô tả (cho Google Calendar API)
     * @return Google Meet link
     */
    public String generateGoogleMeetLink(String summary, LocalDateTime startTime, LocalDateTime endTime, 
                                         String timeZone, String description) {
        // Thử sử dụng Google Calendar API trước
        if (googleCalendarService.isEnabled()) {
            try {
                String meetLink = googleCalendarService.createGoogleMeetLink(
                    summary, startTime, endTime, 
                    timeZone != null ? timeZone : "Asia/Ho_Chi_Minh", 
                    description
                );
                if (meetLink != null && !meetLink.isEmpty()) {
                    return meetLink;
                }
            } catch (Exception e) {
                log.warn("Failed to create Google Meet link via Calendar API, falling back to fake link: {}", e.getMessage());
            }
        }
        
        // Fallback: Tạo meeting code ngẫu nhiên (3 ký tự - 4 ký tự - 3 ký tự)
        log.info("Using fallback Google Meet link generation");
        String part1 = generateRandomString(3);
        String part2 = generateRandomString(4);
        String part3 = generateRandomString(3);
        
        return String.format("https://meet.google.com/%s-%s-%s", part1, part2, part3);
    }
    
    /**
     * Tạo Google Meet link (overload method không có tham số - dùng fallback)
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

