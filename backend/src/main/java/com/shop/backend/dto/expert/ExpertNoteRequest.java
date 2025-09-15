package com.shop.backend.dto.expert;

import lombok.Data;

@Data
public class ExpertNoteRequest {
    private Long studentId;
    private Long testResultId;
    private String note;
    private String noteType;
} 