package com.shop.backend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationMessage {
    private String type; // TEST_RESULT, SEVERE_ALERT, APPOINTMENT, SYSTEM
    private String title;
    private String message;
    private Long userId;
    private String testType;
    private String severity;
    private String priority; // LOW, MEDIUM, HIGH, URGENT
    private Long timestamp;
    private String actionUrl; // URL to navigate when clicked
    private boolean read = false;
}
