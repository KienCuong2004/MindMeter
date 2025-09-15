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
        
        // Debug logging
        // System.out.println("[DEBUG] API called with testKey: " + testKey + ", language: " + language);
        
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
        
        // Debug logging
        // System.out.println("[DEBUG] Returning " + questions.size() + " questions");
        
        return ResponseEntity.ok(questions);
    }
    
    @PostMapping("/submit")
    public ResponseEntity<DepressionTestResponse> submitTest(
            @RequestBody DepressionTestRequest request,
            Authentication authentication) {
        User user;
        
        if (authentication == null || !authentication.isAuthenticated()) {
            // Handle anonymous user case - create a temporary anonymous user
            user = new User();
            user.setId(0L); // Temporary ID for anonymous users
            user.setEmail("anonymous@temp.com");
            user.setFirstName("Anonymous");
            user.setLastName("User");
            user.setRole(Role.STUDENT);
            user.setStatus(User.Status.ACTIVE);
        } else {
            String userName = authentication.getName();
            if (userName.startsWith("anonymous_")) {
                Long userId = Long.parseLong(userName.substring("anonymous_".length()));
                user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Anonymous user not found"));
            } else {
                user = userRepository.findByEmail(userName)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            }
        }
        DepressionTestResponse response = depressionTestService.submitTest(user.getId(), request);
        
        // Send real-time notification
        String testType = request.getTestKey() != null ? request.getTestKey() : "DASS-21";
        String severity = response.getSeverity() != null ? response.getSeverity() : "UNKNOWN";
        String message = String.format("Người dùng %s vừa hoàn thành test %s với mức độ %s", 
            user.getFullName(), testType, severity);
        
        notificationService.sendTestResultNotification(user.getId(), testType, severity, message);
        
        // Send severe alert if needed
        if ("SEVERE".equals(severity)) {
            String severeMessage = String.format("⚠️ CẢNH BÁO: Người dùng %s có kết quả test %s ở mức NGHIÊM TRỌNG", 
                user.getFullName(), testType);
            notificationService.sendSevereTestAlert(user.getId(), testType, severeMessage);
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
        // System.out.println("[DEBUG] Email from token: " + userEmail);
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) {
            System.err.println("[DEBUG] User not found for email: " + userEmail);
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        // System.out.println("[DEBUG] User id: " + user.getId());
        List<DepressionTestResultDTO> history = depressionTestService.getTestHistoryForUser(user.getId());
        // System.out.println("[DEBUG] History size: " + (history != null ? history.size() : 0));
        return ResponseEntity.ok(history);
    }
} 