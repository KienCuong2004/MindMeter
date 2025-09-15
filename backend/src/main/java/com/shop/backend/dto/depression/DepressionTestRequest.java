package com.shop.backend.dto.depression;

import lombok.Data;
import java.util.List;

@Data
public class DepressionTestRequest {
    private List<QuestionAnswer> answers;
    private String testType;
    private String testKey; // Thêm field testKey
    private String language = "vi"; // Thêm field language với default là "vi"
    
    @Data
    public static class QuestionAnswer {
        private Long questionId;
        private Integer answerValue; // 0-3 scale
    }
} 