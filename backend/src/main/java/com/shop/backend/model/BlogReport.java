package com.shop.backend.model;

import com.shop.backend.model.converter.ReportReasonConverter;
import com.shop.backend.model.converter.ReportStatusConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "blog_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlogReport {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private BlogPost post;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Convert(converter = ReportReasonConverter.class)
    @Column(nullable = false)
    private ReportReason reason;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Convert(converter = ReportStatusConverter.class)
    @Column(nullable = false)
    private ReportStatus status = ReportStatus.PENDING;
    
    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum ReportReason {
        SPAM, INAPPROPRIATE, HARASSMENT, FALSE_INFO, OTHER
    }
    
    public enum ReportStatus {
        PENDING, REVIEWED, RESOLVED, DISMISSED
    }
}
