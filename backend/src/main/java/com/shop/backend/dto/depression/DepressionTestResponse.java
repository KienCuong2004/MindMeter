package com.shop.backend.dto.depression;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class DepressionTestResponse {
    private Long testResultId;
    private Integer totalScore;
    private String diagnosis;
    private String severityLevel;
    private String severity;
    private String recommendation;
    private LocalDateTime testedAt;
    private Boolean shouldContactExpert;
} 