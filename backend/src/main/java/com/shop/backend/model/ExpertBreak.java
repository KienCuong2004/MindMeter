package com.shop.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "expert_breaks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExpertBreak {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expert_id", nullable = false)
    private User expert;
    
    @Column(name = "break_date", nullable = false)
    private LocalDate breakDate;
    
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;
    
    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;
    
    @Column(name = "reason")
    private String reason;
    
    @Column(name = "is_recurring")
    private Boolean isRecurring = false;
    
    @Column(name = "recurring_pattern")
    private String recurringPattern; // "WEEKLY", "MONTHLY", "YEARLY"
    
    @Column(name = "created_at")
    @CreationTimestamp
    private java.time.LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    @UpdateTimestamp
    private java.time.LocalDateTime updatedAt;
}
