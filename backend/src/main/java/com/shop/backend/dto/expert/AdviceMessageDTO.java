package com.shop.backend.dto.expert;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AdviceMessageDTO {
    private Long id;
    private Long senderId;
    private Long receiverId;
    private String message;
    private String messageType;
    private Boolean isRead;
    private LocalDateTime sentAt;
} 