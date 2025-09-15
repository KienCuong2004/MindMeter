package com.shop.backend.converter;

import com.shop.backend.model.DepressionTestResult;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class LanguageConverter implements AttributeConverter<DepressionTestResult.Language, String> {
    
    @Override
    public String convertToDatabaseColumn(DepressionTestResult.Language language) {
        if (language == null) {
            return "vi";
        }
        return language.getValue();
    }
    
    @Override
    public DepressionTestResult.Language convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return DepressionTestResult.Language.VI;
        }
        return DepressionTestResult.Language.fromString(dbData);
    }
}
