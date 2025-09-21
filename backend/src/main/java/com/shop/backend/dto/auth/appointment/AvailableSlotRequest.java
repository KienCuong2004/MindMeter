package com.shop.backend.dto.auth.appointment;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AvailableSlotRequest {
    
    private Long expertId;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer durationMinutes = 60;
    private String consultationType = "ONLINE"; // ONLINE, PHONE, IN_PERSON
}
