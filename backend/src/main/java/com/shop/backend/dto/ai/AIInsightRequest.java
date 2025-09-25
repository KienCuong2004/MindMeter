package com.shop.backend.dto.ai;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.List;

/**
 * Request DTO for AI Analytics endpoints
 * Contains all necessary data for GPT analysis
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AIInsightRequest {
    
    /**
     * The prompt to send to GPT
     */
    private String prompt;
    
    /**
     * GPT model to use (gpt-4o-mini, gpt-4, etc.)
     */
    private String model;
    
    /**
     * Maximum tokens for response
     */
    private Integer maxTokens;
    
    /**
     * Temperature for GPT response (0.0-1.0)
     */
    private Double temperature;
    
    /**
     * Current statistics data
     */
    private Map<String, Object> statisticsData;
    
    /**
     * Historical data for trend analysis
     */
    private List<Map<String, Object>> historicalData;
    
    /**
     * Current stats snapshot for recommendations
     */
    private Map<String, Object> currentStats;
    
    /**
     * Full data for executive summaries
     */
    private Map<String, Object> fullData;
    
    /**
     * Additional context or metadata
     */
    private Map<String, Object> context;
    
    /**
     * User preferences for AI response
     */
    private Map<String, Object> preferences;
}
