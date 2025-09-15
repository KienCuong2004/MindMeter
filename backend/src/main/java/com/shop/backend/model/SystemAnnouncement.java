package com.shop.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "system_announcements")
public class SystemAnnouncement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "announcement_type")
    private AnnouncementType announcementType = AnnouncementType.INFO;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public enum AnnouncementType {
        INFO,
        WARNING,
        URGENT,
        GUIDE
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
} 