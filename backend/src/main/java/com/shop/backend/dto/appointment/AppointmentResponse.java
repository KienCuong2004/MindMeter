package com.shop.backend.dto.appointment;

import com.shop.backend.model.Appointment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponse {
    
    private Long id;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private Long expertId;
    private String expertName;
    private String expertEmail;
    private LocalDateTime appointmentDate;
    private Integer durationMinutes;
    private Appointment.AppointmentStatus status;
    private Appointment.ConsultationType consultationType;
    private String meetingLink;
    private String meetingLocation;
    private String notes;
    private String expertNotes;
    private String cancellationReason;
    private String cancelledBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
