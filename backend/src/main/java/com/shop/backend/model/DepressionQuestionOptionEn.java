package com.shop.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "depression_question_options_en")
public class DepressionQuestionOptionEn {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private DepressionQuestionEn question;

    @Column(name = "option_text", nullable = false, columnDefinition = "TEXT")
    private String optionText;

    @Column(name = "option_value", nullable = false)
    private Integer optionValue;

    @Column(name = "`order`")
    private Integer order;
}
