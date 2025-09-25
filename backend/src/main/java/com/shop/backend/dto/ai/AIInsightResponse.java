package com.shop.backend.dto.ai;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for AI Analytics endpoints
 * Contains GPT-generated insights and metadata
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AIInsightResponse {
    
    /**
     * Whether the AI analysis was successful
     */
    private Boolean success;
    
    /**
     * The main AI-generated content
     */
    private String content;
    
    /**
     * Error message if analysis failed
     */
    private String error;
    
    /**
     * Fallback content when AI is not available
     */
    private String fallbackContent;
    
    /**
     * GPT model used for analysis
     */
    private String model;
    
    /**
     * Number of tokens used in the request
     */
    private Integer tokensUsed;
    
    /**
     * Confidence score of the analysis (0-100)
     */
    private Integer confidence;
    
    /**
     * When the analysis was generated
     */
    private LocalDateTime generatedAt;
    
    /**
     * Processing time in milliseconds
     */
    private Long processingTimeMs;
    
    /**
     * Additional metadata
     */
    private Object metadata;
    
    /**
     * Whether the response was cached
     */
    private Boolean cached;
    
    /**
     * Cache expiry time
     */
    private LocalDateTime cacheExpiresAt;
}
