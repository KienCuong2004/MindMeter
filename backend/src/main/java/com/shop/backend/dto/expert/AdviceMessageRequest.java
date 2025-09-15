package com.shop.backend.dto.expert;

import lombok.Data;

@Data
public class AdviceMessageRequest {
    private Long receiverId;
    private String message;
    private String messageType;
} 