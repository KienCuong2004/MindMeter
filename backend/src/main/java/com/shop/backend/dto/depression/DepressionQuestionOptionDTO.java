package com.shop.backend.dto.depression;

public class DepressionQuestionOptionDTO {
    private Long id;
    private String optionText;
    private Integer optionValue;
    private Integer order;

    // Constructors
    public DepressionQuestionOptionDTO() {}

    public DepressionQuestionOptionDTO(Long id, String optionText, Integer optionValue, Integer order) {
        this.id = id;
        this.optionText = optionText;
        this.optionValue = optionValue;
        this.order = order;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOptionText() {
        return optionText;
    }

    public void setOptionText(String optionText) {
        this.optionText = optionText;
    }

    public Integer getOptionValue() {
        return optionValue;
    }

    public void setOptionValue(Integer optionValue) {
        this.optionValue = optionValue;
    }

    public Integer getOrder() {
        return order;
    }

    public void setOrder(Integer order) {
        this.order = order;
    }
}
