package com.shop.backend.dto.depression;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class DepressionTestResultDTO {
    private Long id;
    private String studentName;
    private Integer totalScore;
    private String severityLevel;
    private LocalDateTime testedAt;
    private String diagnosis;
    private String email;
    private String recommendation;
    private String testType;
    private Long userId;
} 