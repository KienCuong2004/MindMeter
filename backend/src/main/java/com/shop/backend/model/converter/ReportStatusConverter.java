package com.shop.backend.model.converter;

import com.shop.backend.model.BlogReport;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class ReportStatusConverter implements AttributeConverter<BlogReport.ReportStatus, String> {
    
    @Override
    public String convertToDatabaseColumn(BlogReport.ReportStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.name().toLowerCase();
    }
    
    @Override
    public BlogReport.ReportStatus convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            return BlogReport.ReportStatus.valueOf(dbData.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown ReportStatus value: " + dbData, e);
        }
    }
}

