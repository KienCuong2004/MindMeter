package com.shop.backend.dto.appointment;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AutoBookingRequest {
    
    private String expertName;
    private String date;
    private String time;
    private Integer durationMinutes = 60;
    private String consultationType = "ONLINE";
    private String notes;
    private String meetingLocation;
}
