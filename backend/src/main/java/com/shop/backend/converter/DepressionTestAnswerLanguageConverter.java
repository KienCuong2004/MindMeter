package com.shop.backend.converter;

import com.shop.backend.model.DepressionTestAnswer;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class DepressionTestAnswerLanguageConverter implements AttributeConverter<DepressionTestAnswer.Language, String> {
    
    @Override
    public String convertToDatabaseColumn(DepressionTestAnswer.Language language) {
        if (language == null) {
            return "vi";
        }
        return language.getValue();
    }
    
    @Override
    public DepressionTestAnswer.Language convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return DepressionTestAnswer.Language.VI;
        }
        return DepressionTestAnswer.Language.fromString(dbData);
    }
}
