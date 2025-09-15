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
        notification.setTitle("⚠️ Cảnh báo: Test trầm cảm nặng");
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
}
