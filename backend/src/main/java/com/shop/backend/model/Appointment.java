package com.shop.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expert_id", nullable = false)
    private User expert;
    
    @Column(name = "appointment_date", nullable = false)
    private LocalDateTime appointmentDate;
    
    @Column(name = "duration_minutes")
    private Integer durationMinutes = 60;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private AppointmentStatus status = AppointmentStatus.PENDING;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "consultation_type")
    private ConsultationType consultationType = ConsultationType.ONLINE;
    
    @Column(name = "meeting_link")
    private String meetingLink;
    
    @Column(name = "meeting_location")
    private String meetingLocation;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "expert_notes", columnDefinition = "TEXT")
    private String expertNotes;
    
    @Column(name = "cancellation_reason")
    private String cancellationReason;
    
    @Column(name = "cancelled_by")
    private String cancelledBy; // "STUDENT", "EXPERT", "SYSTEM"
    
    @Column(name = "created_at")
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    public enum AppointmentStatus {
        PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW
    }
    
    public enum ConsultationType {
        ONLINE, PHONE, IN_PERSON
    }
}
