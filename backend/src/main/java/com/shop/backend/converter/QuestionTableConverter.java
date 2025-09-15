package com.shop.backend.converter;

import com.shop.backend.model.DepressionTestAnswer;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class QuestionTableConverter implements AttributeConverter<DepressionTestAnswer.QuestionTable, String> {
    
    @Override
    public String convertToDatabaseColumn(DepressionTestAnswer.QuestionTable table) {
        if (table == null) {
            return "depression_questions_vi";
        }
        return table.getValue();
    }
    
    @Override
    public DepressionTestAnswer.QuestionTable convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return DepressionTestAnswer.QuestionTable.DEPRESSION_QUESTIONS_VI;
        }
        return DepressionTestAnswer.QuestionTable.fromString(dbData);
    }
}
