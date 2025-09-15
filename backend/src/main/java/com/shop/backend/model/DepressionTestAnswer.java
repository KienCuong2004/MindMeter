package com.shop.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "depression_test_answers")
public class DepressionTestAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_result_id", nullable = false)
    private DepressionTestResult testResult;

    @Column(name = "question_id", nullable = false)
    private Long questionId;

    @Column(name = "answer_value", nullable = false)
    private Integer answerValue;

    @Convert(converter = com.shop.backend.converter.DepressionTestAnswerLanguageConverter.class)
    @Column(name = "language", nullable = false)
    private Language language = Language.VI;

    @Convert(converter = com.shop.backend.converter.QuestionTableConverter.class)
    @Column(name = "question_table", nullable = false)
    private QuestionTable questionTable = QuestionTable.DEPRESSION_QUESTIONS_VI;

    public enum Language {
        VI("vi"), EN("en");
        
        private final String value;
        
        Language(String value) {
            this.value = value;
        }
        
        public String getValue() {
            return value;
        }
        
        public static Language fromString(String text) {
            if (text == null) return VI;
            for (Language language : Language.values()) {
                if (language.value.equalsIgnoreCase(text) || language.name().equalsIgnoreCase(text)) {
                    return language;
                }
            }
            return VI; // Default fallback
        }
    }

    public enum QuestionTable {
        DEPRESSION_QUESTIONS_VI("depression_questions_vi"), 
        DEPRESSION_QUESTIONS_EN("depression_questions_en");
        
        private final String value;
        
        QuestionTable(String value) {
            this.value = value;
        }
        
        public String getValue() {
            return value;
        }
        
        public static QuestionTable fromString(String text) {
            if (text == null) return DEPRESSION_QUESTIONS_VI;
            for (QuestionTable table : QuestionTable.values()) {
                if (table.value.equalsIgnoreCase(text) || table.name().equalsIgnoreCase(text)) {
                    return table;
                }
            }
            return DEPRESSION_QUESTIONS_VI; // Default fallback
        }
    }
} 