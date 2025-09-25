package com.shop.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.List;
import java.util.HashMap;

/**
 * AI Analytics Service for MindMeter
 * Integrates with OpenAI GPT for intelligent statistics analysis
 */
@Service
public class AIAnalyticsService {
    
    @Value("${OPENAI_API_KEY:}")
    private String openAiApiKey;
    
    private final RestTemplate restTemplate;
    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
    
    public AIAnalyticsService() {
        this.restTemplate = new RestTemplate();
    }
    
    @jakarta.annotation.PostConstruct
    public void init() {
        System.out.println("AIAnalyticsService initialized");
        
        // Force reload từ properties
        try {
            java.util.Properties props = new java.util.Properties();
            java.io.FileInputStream fis = new java.io.FileInputStream("src/main/resources/application.properties");
            props.load(fis);
            fis.close();
            
            String apiKeyFromFile = props.getProperty("OPENAI_API_KEY");
            System.out.println("API Key from fil: " + (apiKeyFromFile != null ? apiKeyFromFile.substring(0, Math.min(20, apiKeyFromFile.length())) + "..." : "NULL"));
            
            if (apiKeyFromFile != null && !apiKeyFromFile.trim().isEmpty()) {
                this.openAiApiKey = apiKeyFromFile.trim();
                System.out.println("API Key reloaded from file");
            }
        } catch (Exception e) {
            System.err.println("Could not reload API key from file: " + e.getMessage());
        }
        
        System.out.println("Final OpenAI API Key length: " + (openAiApiKey != null ? openAiApiKey.length() : "NULL"));
        if (openAiApiKey != null) {
            System.out.println("Final OpenAI API Key starts with: " + openAiApiKey.substring(0, Math.min(20, openAiApiKey.length())));
        }
    }
    
    /**
     * Check if AI features are enabled
     */
    public boolean isAIEnabled() {
        return openAiApiKey != null && !openAiApiKey.isEmpty() && !openAiApiKey.startsWith("sk-proj-your");
    }
    
    /**
     * Generate statistics insights using GPT
     */
    public String generateStatisticsInsights(String prompt, Map<String, Object> statisticsData) {
        if (!isAIEnabled()) {
            return generateFallbackInsights(statisticsData);
        }
        
        try {
            return callOpenAI(prompt, "gpt-4o-mini", 0.3, 1000);
        } catch (Exception e) {
            System.err.println("AI Insights Error: " + e.getMessage());
            return generateFallbackInsights(statisticsData);
        }
    }
    
    /**
     * Generate trend predictions
     */
    public String generateTrendPredictions(String prompt, List<Map<String, Object>> historicalData) {
        if (!isAIEnabled()) {
            return generateFallbackTrendPredictions(historicalData);
        }
        
        try {
            return callOpenAI(prompt, "gpt-4o-mini", 0.2, 800);
        } catch (Exception e) {
            System.err.println("Trend Prediction Error: " + e.getMessage());
            return generateFallbackTrendPredictions(historicalData);
        }
    }
    
    /**
     * Generate actionable recommendations
     */
    public String generateActionRecommendations(String prompt, Map<String, Object> currentStats) {
        if (!isAIEnabled()) {
            return generateFallbackRecommendations(currentStats);
        }
        
        try {
            return callOpenAI(prompt, "gpt-4o-mini", 0.3, 600);
        } catch (Exception e) {
            System.err.println("Recommendations Error: " + e.getMessage());
            return generateFallbackRecommendations(currentStats);
        }
    }
    
    /**
     * Generate executive summary
     */
    public String generateExecutiveSummary(String prompt, Map<String, Object> fullData) {
        if (!isAIEnabled()) {
            return "Executive summary: Platform operational with " + 
                   fullData.getOrDefault("totalUsers", 0) + " users. " +
                   "Manual review recommended for detailed analysis.";
        }
        
        try {
            return callOpenAI(prompt, "gpt-4o-mini", 0.4, 500);
        } catch (Exception e) {
            System.err.println("Executive Summary Error: " + e.getMessage());
            return "Executive summary temporarily unavailable. Please review statistics manually.";
        }
    }
    
    /**
     * Call OpenAI API with specified parameters
     */
    private String callOpenAI(String prompt, String model, double temperature, int maxTokens) {
        System.out.println("DEBUG: OpenAI API Key length: " + (openAiApiKey != null ? openAiApiKey.length() : "NULL"));
        System.out.println("DEBUG: OpenAI API Key starts with: " + (openAiApiKey != null ? openAiApiKey.substring(0, Math.min(20, openAiApiKey.length())) : "NULL"));
        
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + openAiApiKey);
        headers.set("Content-Type", "application/json");
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", List.of(
            Map.of("role", "system", "content", "You are an expert mental health data analyst. You MUST respond with valid JSON only. Never use markdown code blocks (```json or ```). Your response must be a valid JSON object that can be parsed directly by JSON.parse()."),
            Map.of("role", "user", "content", prompt + "\n\nCRITICAL: Respond with valid JSON only. No markdown, no code blocks, no explanations, no extra text. Just pure JSON that can be parsed directly.")
        ));
        requestBody.put("max_tokens", maxTokens);
        requestBody.put("temperature", temperature);
        
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        
        try {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                OPENAI_API_URL,
                HttpMethod.POST,
                entity,
                (Class<Map<String, Object>>) (Class<?>) Map.class
            );
            
            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null && responseBody.containsKey("choices")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                if (!choices.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    String content = (String) message.get("content");
                    
                    // Clean up response - remove markdown code blocks if present
                    content = cleanJsonResponse(content);
                    
                    // Log the cleaned response for debugging
                    System.out.println("DEBUG: AI Response (cleaned): " + content);
                    
                    return content;
                }
            }
            
            throw new RuntimeException("Invalid OpenAI response structure");
            
        } catch (Exception e) {
            System.err.println("OpenAI API Error: " + e.getMessage());
            throw new RuntimeException("Failed to get AI response: " + e.getMessage());
        }
    }
    
    /**
     * Clean JSON response by removing markdown code blocks
     */
    private String cleanJsonResponse(String response) {
        if (response == null) return "{}";
        
        // Remove markdown code blocks
        response = response.replaceAll("```json\\s*", "").replaceAll("```\\s*", "");
        
        // Remove any leading/trailing whitespace
        response = response.trim();
        
        // Validate JSON format
        try {
            // Try to parse as JSON to validate
            new com.fasterxml.jackson.databind.ObjectMapper().readTree(response);
            return response;
        } catch (Exception e) {
            // If not valid JSON, wrap it in an object
            System.err.println("Invalid JSON response from AI, wrapping in object: " + response);
            return "{\"message\": \"" + response.replace("\"", "\\\"").replace("\n", "\\n") + "\"}";
        }
    }
    
    /**
     * Generate fallback insights when AI is not available
     */
    public String generateFallbackInsights(Map<String, Object> statisticsData) {
        int totalTests = (Integer) statisticsData.getOrDefault("totalTests", 0);
        int severeCount = (Integer) statisticsData.getOrDefault("severe", 0);
        int moderateCount = (Integer) statisticsData.getOrDefault("moderate", 0);
        
        double severeRatio = totalTests > 0 ? (double) severeCount / totalTests * 100 : 0;
        double riskRatio = totalTests > 0 ? (double) (severeCount + moderateCount) / totalTests * 100 : 0;
        
        return String.format("""
        {
          "insights": [
            {"message": "Total assessments: %d with %.1f%% severe cases", "confidence": 100},
            {"message": "High-risk cases (severe + moderate): %.1f%% of total", "confidence": 100},
            {"message": "Recommended focus: %s", "confidence": 90}
          ],
          "alerts": %s,
          "recommendations": [
            {"action": "Monitor severe cases daily", "urgency": "High", "assignee": "Mental Health Team"},
            {"action": "Review expert capacity", "urgency": "Medium", "assignee": "Admin"}
          ]
        }
        """, 
        totalTests, 
        severeRatio,
        riskRatio,
        severeRatio > 20 ? "Immediate intervention needed" : "Continue monitoring",
        severeRatio > 25 ? "[{\"message\":\"Critical: High severe case ratio\",\"priority\":\"urgent\"}]" : "[]"
        );
    }
    
    /**
     * Generate fallback trend predictions
     */
    public String generateFallbackTrendPredictions(List<Map<String, Object>> historicalData) {
        return """
        {
          "nextWeek": "Trend analysis requires more historical data",
          "risks": ["Monitor severe cases carefully"],
          "confidence": 75,
          "lastUpdated": "Manual analysis"
        }
        """;
    }
    
    /**
     * Generate fallback recommendations
     */
    public String generateFallbackRecommendations(Map<String, Object> currentStats) {
        return """
        [
          {"action": "Monitor severe depression cases", "urgency": "High", "assignee": "Mental Health Team", "deadline": "Daily"},
          {"action": "Review expert capacity", "urgency": "Medium", "assignee": "Admin", "deadline": "Weekly"}
        ]
        """;
    }
}
