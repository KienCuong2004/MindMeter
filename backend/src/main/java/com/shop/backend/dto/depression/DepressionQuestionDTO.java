package com.shop.backend.dto.depression;

import lombok.Data;
import java.util.List;
import com.shop.backend.model.DepressionQuestionOption;

@Data
public class DepressionQuestionDTO {
    private Long id;
    private String questionText;
    private String questionTextEn;
    private String questionTextVi;
    private Integer weight;
    private String category;
    private String testKey;
    private Integer order;
    private Boolean isActive;
    private List<DepressionQuestionOption> options;
    private List<DepressionQuestionOptionDTO> optionsEn;
    private List<DepressionQuestionOptionDTO> optionsVi;
} 