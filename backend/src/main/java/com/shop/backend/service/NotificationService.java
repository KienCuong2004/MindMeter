package com.shop.backend.service;

import com.shop.backend.model.NotificationMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void sendTestResultNotification(Long userId, String testType, String severity, String message) {
        NotificationMessage notification = new NotificationMessage();
        notification.setType("TEST_RESULT");
        notification.setTitle("Kết quả test mới");
        notification.setMessage(message);
        notification.setUserId(userId);
        notification.setTestType(testType);
        notification.setSeverity(severity);
        notification.setTimestamp(System.currentTimeMillis());

        // Send to all admins and experts
        messagingTemplate.convertAndSend("/topic/notifications", notification);
        
        // Send to specific user if they're online
        messagingTemplate.convertAndSendToUser(
            userId.toString(), 
            "/queue/notifications", 
            notification
        );
    }

    public void sendSevereTestAlert(Long userId, String testType, String message) {
        NotificationMessage notification = new NotificationMessage();
        notification.setType("SEVERE_ALERT");
        notification.setTitle("Cảnh báo: Test trầm cảm nặng");
        notification.setMessage(message);
        notification.setUserId(userId);
        notification.setTestType(testType);
        notification.setSeverity("SEVERE");
        notification.setTimestamp(System.currentTimeMillis());
        notification.setPriority("HIGH");

        // Send urgent notification to all admins and experts
        messagingTemplate.convertAndSend("/topic/severe-alerts", notification);
    }

    public void sendAppointmentNotification(Long userId, String message) {
        NotificationMessage notification = new NotificationMessage();
        notification.setType("APPOINTMENT");
        notification.setTitle("Lịch hẹn mới");
        notification.setMessage(message);
        notification.setUserId(userId);
        notification.setTimestamp(System.currentTimeMillis());

        messagingTemplate.convertAndSend("/topic/appointments", notification);
    }

    public void sendSystemNotification(String title, String message, String type) {
        NotificationMessage notification = new NotificationMessage();
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setTimestamp(System.currentTimeMillis());

        messagingTemplate.convertAndSend("/topic/system", notification);
    }

    /**
     * Gửi cập nhật appointment qua WebSocket cho học sinh và chuyên gia
     */
    public void sendAppointmentUpdate(com.shop.backend.dto.auth.appointment.AppointmentResponse appointment) {
        // Gửi cho tất cả clients đang lắng nghe
        messagingTemplate.convertAndSend("/topic/appointment-updates", appointment);
        
        // Gửi riêng cho học sinh
        messagingTemplate.convertAndSendToUser(
            appointment.getStudentId().toString(),
            "/queue/appointment-updates",
            appointment
        );
        
        // Gửi riêng cho chuyên gia
        messagingTemplate.convertAndSendToUser(
            appointment.getExpertId().toString(),
            "/queue/appointment-updates",
            appointment
        );
    }

    /**
     * Gửi thông báo vi phạm comment cho user
     */
    public void sendCommentViolationNotification(Long userId, String title, String message, String violationType) {
        NotificationMessage notification = new NotificationMessage();
        notification.setType("COMMENT_VIOLATION");
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setUserId(userId);
        notification.setSeverity(violationType); // Sử dụng severity field để lưu violation type
        notification.setPriority("MEDIUM");
        notification.setTimestamp(System.currentTimeMillis());
        notification.setActionUrl("/blog/comments"); // Link đến trang comment

        // Gửi thông báo cho user cụ thể
        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/queue/notifications",
            notification
        );

        // Gửi thông báo cho admin để review
        messagingTemplate.convertAndSend("/topic/admin-violations", notification);
    }
}
