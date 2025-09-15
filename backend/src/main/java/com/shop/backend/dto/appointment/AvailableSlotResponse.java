package com.shop.backend.dto.appointment;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AvailableSlotResponse {
    
    private Long expertId;
    private String expertName;
    private List<TimeSlot> availableSlots;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeSlot {
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private Integer durationMinutes;
        private String consultationType;
        private Boolean isAvailable;
    }
}
