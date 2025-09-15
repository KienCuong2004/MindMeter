package com.shop.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Entity
@Table(name = "expert_schedules")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExpertSchedule {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expert_id", nullable = false)
    private User expert;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false)
    private DayOfWeek dayOfWeek;
    
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;
    
    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;
    
    @Column(name = "is_available")
    private Boolean isAvailable = true;
    
    @Column(name = "max_appointments_per_day")
    private Integer maxAppointmentsPerDay = 8;
    
    @Column(name = "appointment_duration_minutes")
    private Integer appointmentDurationMinutes = 60;
    
    @Column(name = "break_duration_minutes")
    private Integer breakDurationMinutes = 15;
    
    @Column(name = "created_at")
    @CreationTimestamp
    private java.time.LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    @UpdateTimestamp
    private java.time.LocalDateTime updatedAt;
}
