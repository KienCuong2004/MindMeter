package com.shop.backend.dto.appointment;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AutoBookingResponse {
    
    private boolean success;
    private String message;
    private Long appointmentId;
    private String expertName;
    private String appointmentDate;
    private String appointmentTime;
    private String status;
    private String consultationType;
    private String notes;
}
