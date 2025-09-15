package com.shop.backend.controller;

import com.shop.backend.dto.depression.DepressionTestResponse;
import com.shop.backend.service.TestResultEmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/test-email")
@CrossOrigin
public class TestEmailController {
    
    @Autowired
    private TestResultEmailService emailService;
    
    @PostMapping("/send-test-result")
    public ResponseEntity<?> sendTestResultEmail(@RequestBody TestEmailRequest request) {
        try {
            // Tạo test response
            DepressionTestResponse testResponse = new DepressionTestResponse();
            testResponse.setTestResultId(1L);
            testResponse.setTotalScore(request.getScore());
            testResponse.setDiagnosis("TEST_DIAGNOSIS");
            testResponse.setSeverityLevel(request.getSeverityLevel());
            testResponse.setRecommendation("Test recommendation");
            testResponse.setTestedAt(LocalDateTime.now());
            testResponse.setShouldContactExpert("SEVERE".equals(request.getSeverityLevel()));
            
            // Gửi email
            emailService.sendTestResultEmail(request.getUserId(), testResponse, request.getTestType());
            
            return ResponseEntity.ok("Test result email sent successfully to user ID: " + request.getUserId());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to send email: " + e.getMessage());
        }
    }
    
    public static class TestEmailRequest {
        private Long userId;
        private String testType;
        private Integer score;
        private String severityLevel;
        
        // Getters and setters
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        
        public String getTestType() { return testType; }
        public void setTestType(String testType) { this.testType = testType; }
        
        public Integer getScore() { return score; }
        public void setScore(Integer score) { this.score = score; }
        
        public String getSeverityLevel() { return severityLevel; }
        public void setSeverityLevel(String severityLevel) { this.severityLevel = severityLevel; }
    }
}
