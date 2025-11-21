package com.shop.backend.model.converter;

import com.shop.backend.model.BlogReport;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class ReportReasonConverter implements AttributeConverter<BlogReport.ReportReason, String> {
    
    @Override
    public String convertToDatabaseColumn(BlogReport.ReportReason attribute) {
        if (attribute == null) {
            return null;
        }
        // Convert UPPERCASE enum to lowercase database value
        // Handle special case: FALSE_INFO -> false_info
        if (attribute == BlogReport.ReportReason.FALSE_INFO) {
            return "false_info";
        }
        return attribute.name().toLowerCase();
    }
    
    @Override
    public BlogReport.ReportReason convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            // Convert lowercase with underscore to UPPERCASE
            // Handle 'false_info' -> 'FALSE_INFO' mapping
            String normalized = dbData.toUpperCase();
            // If already uppercase with underscore, use as is
            return BlogReport.ReportReason.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            // Try mapping common variations
            if (dbData.equalsIgnoreCase("false_info")) {
                return BlogReport.ReportReason.FALSE_INFO;
            }
            // Log error for debugging
            System.err.println("Error converting ReportReason: " + dbData);
            throw new IllegalArgumentException("Unknown ReportReason value: " + dbData, e);
        }
    }
}

