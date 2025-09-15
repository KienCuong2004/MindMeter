package com.shop.backend.dto.appointment;

import com.shop.backend.model.Appointment;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentRequest {
    
    private Long expertId;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime appointmentDate;
    
    private Integer durationMinutes = 60;
    private Appointment.ConsultationType consultationType = Appointment.ConsultationType.ONLINE;
    private String notes;
    private String meetingLocation;
}
