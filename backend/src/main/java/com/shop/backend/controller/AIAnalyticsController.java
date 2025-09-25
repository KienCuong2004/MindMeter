package com.shop.backend.controller;

import com.shop.backend.service.AIAnalyticsService;
import com.shop.backend.dto.ai.AIInsightRequest;
import com.shop.backend.dto.ai.AIInsightResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * AI Analytics Controller for MindMeter
 * Provides GPT-powered insights for mental health statistics
 */
@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost"})
public class AIAnalyticsController {
    
    @Autowired
    private AIAnalyticsService aiAnalyticsService;
    
    /**
     * Generate AI insights from statistics data
     * Only accessible by ADMIN users
     */
    @PostMapping("/analyze-statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AIInsightResponse> analyzeStatistics(
            @RequestBody AIInsightRequest request) {
        
        try {
            String insights = aiAnalyticsService.generateStatisticsInsights(
                request.getPrompt(),
                request.getStatisticsData()
            );
            
            return ResponseEntity.ok(AIInsightResponse.builder()
                .success(true)
                .content(insights)
                .model(request.getModel())
                .tokensUsed(estimateTokens(insights))
                .generatedAt(java.time.LocalDateTime.now())
                .build());
                
        } catch (Exception e) {
            return ResponseEntity.ok(AIInsightResponse.builder()
                .success(false)
                .error("Failed to generate insights: " + e.getMessage())
                .fallbackContent(aiAnalyticsService.generateFallbackInsights(request.getStatisticsData()))
                .build());
        }
    }
    
    /**
     * Generate trend predictions
     */
    @PostMapping("/predict-trends")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AIInsightResponse> predictTrends(
            @RequestBody AIInsightRequest request) {
        
        try {
            String predictions = aiAnalyticsService.generateTrendPredictions(
                request.getPrompt(),
                request.getHistoricalData()
            );
            
            return ResponseEntity.ok(AIInsightResponse.builder()
                .success(true)
                .content(predictions)
                .model(request.getModel())
                .generatedAt(java.time.LocalDateTime.now())
                .build());
                
        } catch (Exception e) {
            return ResponseEntity.ok(AIInsightResponse.builder()
                .success(false)
                .error("Failed to predict trends: " + e.getMessage())
                .fallbackContent("Trend analysis requires more historical data")
                .build());
        }
    }
    
    /**
     * Generate actionable recommendations
     */
    @PostMapping("/generate-recommendations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AIInsightResponse> generateRecommendations(
            @RequestBody AIInsightRequest request) {
        
        try {
            String recommendations = aiAnalyticsService.generateActionRecommendations(
                request.getPrompt(),
                request.getCurrentStats()
            );
            
            return ResponseEntity.ok(AIInsightResponse.builder()
                .success(true)
                .content(recommendations)
                .model(request.getModel())
                .generatedAt(java.time.LocalDateTime.now())
                .build());
                
        } catch (Exception e) {
            return ResponseEntity.ok(AIInsightResponse.builder()
                .success(false)
                .error("Failed to generate recommendations: " + e.getMessage())
                .fallbackContent("[{\"action\":\"Monitor severe cases\",\"urgency\":\"High\",\"assignee\":\"Mental Health Team\"}]")
                .build());
        }
    }
    
    /**
     * Generate executive summary
     */
    @PostMapping("/executive-summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AIInsightResponse> generateExecutiveSummary(
            @RequestBody AIInsightRequest request) {
        
        try {
            String summary = aiAnalyticsService.generateExecutiveSummary(
                request.getPrompt(),
                request.getFullData()
            );
            
            return ResponseEntity.ok(AIInsightResponse.builder()
                .success(true)
                .content(summary)
                .model(request.getModel())
                .generatedAt(java.time.LocalDateTime.now())
                .build());
                
        } catch (Exception e) {
            return ResponseEntity.ok(AIInsightResponse.builder()
                .success(false)
                .error("Failed to generate summary: " + e.getMessage())
                .fallbackContent("Executive summary requires complete statistics data")
                .build());
        }
    }
    
    /**
     * Get AI analytics configuration
     */
    @GetMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAIConfig() {
        return ResponseEntity.ok(Map.of(
            "aiEnabled", aiAnalyticsService.isAIEnabled(),
            "model", "gpt-4o-mini",
            "features", new String[]{"insights", "predictions", "recommendations", "summaries"},
            "lastUpdated", java.time.LocalDateTime.now()
        ));
    }
    
    /**
     * Estimate token count for response
     */
    private int estimateTokens(String content) {
        // Rough estimation: 1 token ≈ 4 characters
        return content.length() / 4;
    }
}
