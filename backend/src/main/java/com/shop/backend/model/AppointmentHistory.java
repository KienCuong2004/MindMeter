package com.shop.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointment_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false)
    private HistoryAction action;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "old_status")
    private Appointment.AppointmentStatus oldStatus;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "new_status")
    private Appointment.AppointmentStatus newStatus;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by", nullable = false)
    private User changedBy;
    
    @Column(name = "change_reason", columnDefinition = "TEXT")
    private String changeReason;
    
    @Column(name = "changed_at")
    @CreationTimestamp
    private LocalDateTime changedAt;
    
    public enum HistoryAction {
        CREATED, UPDATED, CANCELLED, CONFIRMED, COMPLETED, NO_SHOW
    }
}

