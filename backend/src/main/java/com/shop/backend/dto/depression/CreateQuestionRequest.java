package com.shop.backend.dto.depression;

import lombok.Data;
import java.util.List;

@Data
public class CreateQuestionRequest {
    private String questionText;
    private String questionTextEn;
    private String questionTextVi;
    private Integer weight;
    private String category;
    private Integer order;
    private Boolean isActive;
    private String testKey;
    private List<QuestionOptionRequest> options;
    private List<QuestionOptionRequest> optionsEn;
    private List<QuestionOptionRequest> optionsVi;
    
    @Data
    public static class QuestionOptionRequest {
        private String optionText;
        private Integer optionValue;
        private Integer order;
    }
} 