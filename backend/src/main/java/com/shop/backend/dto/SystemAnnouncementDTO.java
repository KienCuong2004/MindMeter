package com.shop.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SystemAnnouncementDTO {
    private Long id;
    private String title;
    private String content;
    private String announcementType; // code: INFO, WARNING, GUIDE, URGENT
    private Boolean isActive;
    private LocalDateTime createdAt;
} 