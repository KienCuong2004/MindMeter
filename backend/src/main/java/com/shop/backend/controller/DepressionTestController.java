package com.shop.backend.controller;

import com.shop.backend.dto.depression.DepressionTestRequest;
import com.shop.backend.dto.depression.DepressionTestResponse;
import com.shop.backend.dto.depression.DepressionQuestionDTO;
import com.shop.backend.dto.depression.DepressionTestResultDTO;
import com.shop.backend.model.User;
import com.shop.backend.model.Role;
import com.shop.backend.repository.UserRepository;
import com.shop.backend.service.DepressionTestService;
import com.shop.backend.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/depression-test")
public class DepressionTestController {
    
    @Autowired
    private DepressionTestService depressionTestService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    @GetMapping("/questions")
    public ResponseEntity<List<DepressionQuestionDTO>> getQuestions(
            @RequestParam(value = "type", required = false) String testKey,
            @RequestParam(value = "lang", defaultValue = "vi") String language) {
        
        List<DepressionQuestionDTO> questions;
        if (testKey != null && !testKey.isEmpty()) {
            questions = depressionTestService.getActiveQuestionDTOsByTestKeyAndLanguage(testKey, language);
        } else {
            if ("en".equals(language)) {
                questions = depressionTestService.getActiveQuestionDTOsEn();
            } else {
                questions = depressionTestService.getActiveQuestionDTOsVi();
            }
        }
        
        return ResponseEntity.ok(questions);
    }
    
    @PostMapping("/submit")
    public ResponseEntity<DepressionTestResponse> submitTest(
            @RequestBody DepressionTestRequest request,
            Authentication authentication) {
        User user;
        Long userId;
        
        if (authentication == null || !authentication.isAuthenticated()) {
            // Handle anonymous user case - create a temporary anonymous user
            user = new User();
            user.setId(null); // No real ID for anonymous users
            user.setEmail("anonymous@temp.com");
            user.setFirstName("Anonymous");
            user.setLastName("User");
            user.setRole(Role.STUDENT);
            user.setStatus(User.Status.ACTIVE);
            userId = null; // Anonymous users don't have real user ID
        } else {
            String userName = authentication.getName();
            if (userName.startsWith("anon_")) {
                // Session-based anonymous user - no database record
                user = new User();
                user.setId(null);
                user.setEmail(null);
                user.setFirstName("Anonymous");
                user.setLastName("User");
                user.setRole(Role.STUDENT);
                user.setStatus(User.Status.ACTIVE);
                userId = null; // Anonymous users don't have real user ID
            } else {
                user = userRepository.findByEmail(userName)
                    .orElseThrow(() -> new RuntimeException("User not found"));
                userId = user.getId();
            }
        }
        DepressionTestResponse response = depressionTestService.submitTest(userId, request);
        
        // Send real-time notification (only for authenticated users)
        if (userId != null) {
            String testType = request.getTestKey() != null ? request.getTestKey() : "DASS-21";
            String severity = response.getSeverity() != null ? response.getSeverity() : "UNKNOWN";
            String message = String.format("Người dùng %s vừa hoàn thành test %s với mức độ %s", 
                user.getFullName(), testType, severity);
            
            notificationService.sendTestResultNotification(userId, testType, severity, message);
            
            // Send severe alert if needed
            if ("SEVERE".equals(severity)) {
                String severeMessage = String.format("CẢNH BÁO: Người dùng %s có kết quả test %s ở mức NGHIÊM TRỌNG", 
                    user.getFullName(), testType);
                notificationService.sendSevereTestAlert(userId, testType, severeMessage);
            }
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        List<String> categories = depressionTestService.getAllCategories();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/history")
    public ResponseEntity<List<DepressionTestResultDTO>> getTestHistory(Authentication authentication) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        List<DepressionTestResultDTO> history = depressionTestService.getTestHistoryForUser(user.getId());
        return ResponseEntity.ok(history);
    }
} 