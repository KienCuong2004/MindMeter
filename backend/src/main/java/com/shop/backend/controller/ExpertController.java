package com.shop.backend.controller;

import com.shop.backend.dto.expert.ExpertNoteRequest;
import com.shop.backend.dto.expert.AdviceMessageRequest;
import com.shop.backend.model.*;
import com.shop.backend.repository.UserRepository;
import com.shop.backend.repository.DepressionQuestionViRepository;
import com.shop.backend.repository.DepressionQuestionEnRepository;
import com.shop.backend.service.ExpertService;
import com.shop.backend.dto.depression.DepressionTestResultDTO;
import com.shop.backend.repository.DepressionTestAnswerRepository;
import com.shop.backend.dto.expert.AdviceMessageDTO;
import com.shop.backend.dto.UserDTO;
import com.shop.backend.security.JwtService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.HashMap;
import java.util.Date;

@RestController
@RequestMapping("/api/expert")
public class ExpertController {
    private static final Logger logger = LoggerFactory.getLogger(ExpertController.class);
    
    // Thư mục lưu trữ avatar
    private static final String AVATAR_UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/avatars/";
    
    @Autowired
    private ExpertService expertService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private DepressionTestAnswerRepository depressionTestAnswerRepository;
    
    @Autowired
    private DepressionQuestionViRepository depressionQuestionViRepository;
    
    @Autowired
    private DepressionQuestionEnRepository depressionQuestionEnRepository;
    
    @Autowired
    private JwtService jwtService;
    
    // Helper method to get expert ID from authentication
    private Long getExpertIdFromAuthentication(Authentication authentication) {
        String userEmail = authentication.getName();
        logger.info("[ExpertController] Email from token: {}", userEmail);
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> {
                logger.error("[ExpertController] User not found for email: {}", userEmail);
                return new RuntimeException("User not found for email: " + userEmail);
            });
        logger.info("[ExpertController] Found expertId: {} for email: {}", user.getId(), userEmail);
        return user.getId();
    }
    
    // Lấy danh sách tất cả kết quả test
    @GetMapping("/test-results")
    public ResponseEntity<List<DepressionTestResultDTO>> getAllTestResults() {
        List<DepressionTestResultDTO> results = expertService.getAllTestResultDTOs();
        return ResponseEntity.ok(results);
    }
    
    // Lấy danh sách kết quả test theo mức độ nghiêm trọng
    @GetMapping("/test-results/severity/{severityLevel}")
    public ResponseEntity<List<DepressionTestResultDTO>> getTestResultsBySeverity(
            @PathVariable String severityLevel) {
        try {
            DepressionTestResult.SeverityLevel level = DepressionTestResult.SeverityLevel.valueOf(severityLevel.toUpperCase());
            List<DepressionTestResult> results = expertService.getTestResultsBySeverity(level);
            List<DepressionTestResultDTO> dtos = results.stream().map(result -> {
                DepressionTestResultDTO dto = new DepressionTestResultDTO();
                dto.setId(result.getId());
                dto.setTotalScore(result.getTotalScore());
                dto.setSeverityLevel(result.getSeverityLevel() != null ? result.getSeverityLevel().name() : null);
                dto.setTestedAt(result.getTestedAt());
                dto.setDiagnosis(result.getDiagnosis());
                
                // Lấy thông tin user nếu có
                if (result.getUser() != null) {
                    dto.setStudentName(result.getUser().getFirstName() + " " + result.getUser().getLastName());
                    dto.setEmail(result.getUser().getEmail());
                }
                dto.setTestType(result.getTestType());
                
                return dto;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Lấy lịch sử test của một học sinh
    @GetMapping("/student/{studentId}/test-history")
    public ResponseEntity<List<DepressionTestResultDTO>> getStudentTestHistory(@PathVariable Long studentId) {
        List<DepressionTestResult> history = expertService.getStudentTestHistory(studentId);
        List<DepressionTestResultDTO> dtos = history.stream().map(result -> {
            DepressionTestResultDTO dto = new DepressionTestResultDTO();
            dto.setId(result.getId());
            dto.setTotalScore(result.getTotalScore());
            dto.setSeverityLevel(result.getSeverityLevel() != null ? result.getSeverityLevel().name() : null);
            dto.setTestedAt(result.getTestedAt());
            dto.setDiagnosis(result.getDiagnosis());
            
            // Lấy thông tin user nếu có
            if (result.getUser() != null) {
                dto.setStudentName(result.getUser().getFirstName() + " " + result.getUser().getLastName());
                dto.setEmail(result.getUser().getEmail());
            }
            dto.setTestType(result.getTestType());
            
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    // Tạo nhận xét cho học sinh
    @PostMapping("/notes")
    public ResponseEntity<ExpertNote> createNote(
            @RequestBody ExpertNoteRequest request,
            Authentication authentication) {
        Long expertId = getExpertIdFromAuthentication(authentication);
        ExpertNote note = expertService.createNote(expertId, request);
        return ResponseEntity.ok(note);
    }
    
    // Gửi lời khuyên/tư vấn
    @PostMapping("/advice")
    public ResponseEntity<AdviceMessage> sendAdvice(
            @RequestBody AdviceMessageRequest request,
            Authentication authentication) {
        Long expertId = getExpertIdFromAuthentication(authentication);
        AdviceMessage message = expertService.sendAdvice(expertId, request);
        return ResponseEntity.ok(message);
    }
    
    // Lấy danh sách nhận xét của chuyên gia
    @GetMapping("/notes")
    public ResponseEntity<List<ExpertNote>> getExpertNotes(Authentication authentication) {
        Long expertId = getExpertIdFromAuthentication(authentication);
        List<ExpertNote> notes = expertService.getExpertNotes(expertId);
        return ResponseEntity.ok(notes);
    }
    
    // Lấy danh sách nhận xét cho một học sinh
    @GetMapping("/student/{studentId}/notes")
    public ResponseEntity<List<ExpertNote>> getStudentNotes(@PathVariable Long studentId) {
        List<ExpertNote> notes = expertService.getStudentNotes(studentId);
        return ResponseEntity.ok(notes);
    }
    
    // Lấy tin nhắn đã gửi
    @GetMapping("/messages/sent")
    public ResponseEntity<List<AdviceMessageDTO>> getSentMessages(Authentication authentication) {
        Long expertId = getExpertIdFromAuthentication(authentication);
        List<AdviceMessageDTO> messages = expertService.getSentMessages(expertId);
        logger.info("[ExpertController] expertId {} has {} sent advice messages", expertId, messages.size());
        return ResponseEntity.ok(messages);
    }
    
    // Đánh dấu tin nhắn đã đọc
    @PutMapping("/messages/{messageId}/read")
    public ResponseEntity<?> markMessageAsRead(@PathVariable Long messageId) {
        expertService.markMessageAsRead(messageId);
        return ResponseEntity.ok().build();
    }
    
    // Lấy đáp án chi tiết cho một bài test
    @GetMapping("/test-results/{testResultId}/answers")
    public ResponseEntity<List<AnswerDetailDTO>> getTestAnswers(@PathVariable Long testResultId) {
        List<DepressionTestAnswer> answers = depressionTestAnswerRepository.findByTestResultId(testResultId);
        List<AnswerDetailDTO> result = answers.stream().map(ans -> {
            AnswerDetailDTO dto = new AnswerDetailDTO();
            dto.setQuestionId(ans.getQuestionId());
            dto.setAnswerValue(ans.getAnswerValue());
            
            // Lấy câu hỏi bằng cả hai ngôn ngữ dựa trên language field
            String questionTextEn = null;
            String questionTextVi = null;
            
            // Sử dụng language field từ test answer để xác định ngôn ngữ
            if (ans.getLanguage() != null) {
                if (ans.getLanguage().name().equals("EN")) {
                    // Câu hỏi tiếng Anh - lấy từ bảng EN
                    var questionEnOpt = depressionQuestionEnRepository.findById(ans.getQuestionId());
                    if (questionEnOpt.isPresent()) {
                        questionTextEn = questionEnOpt.get().getQuestionText();
                        // Tìm câu hỏi tiếng Việt tương ứng
                        questionTextVi = findVietnameseQuestionFromEn(questionEnOpt.get());
                    }
                } else {
                    // Câu hỏi tiếng Việt - lấy từ bảng VI
                    var questionViOpt = depressionQuestionViRepository.findById(ans.getQuestionId());
                    if (questionViOpt.isPresent()) {
                        questionTextVi = questionViOpt.get().getQuestionText();
                        // Tìm câu hỏi tiếng Anh tương ứng
                        questionTextEn = findEnglishQuestionFromVi(questionViOpt.get());
                    }
                }
            } else {
                // Fallback: sử dụng questionId để tìm trong cả hai bảng
                var questionEnOpt = depressionQuestionEnRepository.findById(ans.getQuestionId());
                var questionViOpt = depressionQuestionViRepository.findById(ans.getQuestionId());
                
                if (questionEnOpt.isPresent()) {
                    questionTextEn = questionEnOpt.get().getQuestionText();
                    questionTextVi = findVietnameseQuestionFromEn(questionEnOpt.get());
                } else if (questionViOpt.isPresent()) {
                    questionTextVi = questionViOpt.get().getQuestionText();
                    questionTextEn = findEnglishQuestionFromVi(questionViOpt.get());
                }
            }
            
            dto.setQuestionTextEn(questionTextEn);
            dto.setQuestionTextVi(questionTextVi);
            
            return dto;
        }).toList();
        return ResponseEntity.ok(result);
    }
    
    // Hàm tìm câu hỏi tiếng Việt tương ứng từ câu hỏi tiếng Anh
    private String findVietnameseQuestionFromEn(DepressionQuestionEn questionEn) {
        try {
            String testKey = questionEn.getTestKey();
            Integer order = questionEn.getOrder();
            
            // Nếu test_key kết thúc bằng -EN, tìm câu hỏi tiếng Việt tương ứng
            if (testKey.endsWith("-EN")) {
                String baseTestKey = testKey.substring(0, testKey.length() - 3);
                List<DepressionQuestionVi> viQuestions = depressionQuestionViRepository.findByTestKeyAndIsActiveTrue(baseTestKey);
                // Tìm câu hỏi có order tương ứng
                for (DepressionQuestionVi viQuestion : viQuestions) {
                    if (viQuestion.getOrder().equals(order)) {
                        return viQuestion.getQuestionText();
                    }
                }
            }
            
            return null;
        } catch (Exception e) {
            return null;
        }
    }
    
    // Hàm tìm câu hỏi tiếng Anh tương ứng từ câu hỏi tiếng Việt
    private String findEnglishQuestionFromVi(DepressionQuestionVi questionVi) {
        try {
            String testKey = questionVi.getTestKey();
            Integer order = questionVi.getOrder();
            
            // Nếu test_key không kết thúc bằng -EN, tìm câu hỏi tiếng Anh tương ứng
            if (!testKey.endsWith("-EN")) {
                String enTestKey = testKey + "-EN";
                List<DepressionQuestionEn> enQuestions = depressionQuestionEnRepository.findByTestKeyAndIsActiveTrue(enTestKey);
                // Tìm câu hỏi có order tương ứng
                for (DepressionQuestionEn enQuestion : enQuestions) {
                    if (enQuestion.getOrder().equals(order)) {
                        return enQuestion.getQuestionText();
                    }
                }
            }
            
            return null;
        } catch (Exception e) {
            return null;
        }
    }
    

    // DTO cho đáp án chi tiết
    public static class AnswerDetailDTO {
        private Long questionId;
        private String questionText;
        private Integer answerValue;
        private String questionTextEn;
        private String questionTextVi;
        
        // getters/setters
        public Long getQuestionId() { return questionId; }
        public void setQuestionId(Long questionId) { this.questionId = questionId; }
        public String getQuestionText() { return questionText; }
        public void setQuestionText(String questionText) { this.questionText = questionText; }
        public Integer getAnswerValue() { return answerValue; }
        public void setAnswerValue(Integer answerValue) { this.answerValue = answerValue; }
        public String getQuestionTextEn() { return questionTextEn; }
        public void setQuestionTextEn(String questionTextEn) { this.questionTextEn = questionTextEn; }
        public String getQuestionTextVi() { return questionTextVi; }
        public void setQuestionTextVi(String questionTextVi) { this.questionTextVi = questionTextVi; }
    }

    // Thống kê số lượt test theo ngày (và số severe test) trong khoảng thời gian
    @GetMapping("/statistics/test-count-by-date")
    public ResponseEntity<?> getTestCountByDateRange(@RequestParam(defaultValue = "14") int days) {
        return ResponseEntity.ok(expertService.getTestCountByDateRange(days));
    }

    // Thống kê tổng quan cho expert
    @GetMapping("/statistics")
    public ResponseEntity<?> getExpertStatistics() {
        return ResponseEntity.ok(expertService.getExpertStatistics());
    }

    // Lấy kết quả test gần đây cho expert
    @GetMapping("/test-results/recent")
    public ResponseEntity<List<DepressionTestResultDTO>> getRecentTestResults() {
        List<DepressionTestResultDTO> results = expertService.getRecentTestResults();
        return ResponseEntity.ok(results);
    }

    @GetMapping("/profile")
    public ResponseEntity<UserDTO> getCurrentExpertProfile(Authentication authentication) {
        String email = authentication.getName();
        UserDTO dto = expertService.getCurrentExpertProfile(email);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserDTO> updateCurrentExpertProfile(@RequestBody UserDTO updateDto, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found for email: " + email));
        if (updateDto.getFirstName() != null) user.setFirstName(updateDto.getFirstName());
        if (updateDto.getLastName() != null) user.setLastName(updateDto.getLastName());
        if (updateDto.getPhone() != null) user.setPhone(updateDto.getPhone());
        if (updateDto.getAvatarUrl() != null) user.setAvatarUrl(updateDto.getAvatarUrl());
        userRepository.save(user);
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setRole(user.getRole() != null ? user.getRole().name() : null);
        dto.setStatus(user.getStatus() != null ? user.getStatus().name() : null);
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        dto.setPlan(user.getPlan());
        dto.setPlanStartDate(user.getPlanStartDate());
        dto.setPlanExpiryDate(user.getPlanExpiryDate());
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshExpertToken(Authentication authentication) {
        try {
            logger.info("[ExpertController] refresh-token endpoint called");
            String email = authentication.getName();
            logger.info("[ExpertController] Email from authentication: {}", email);
            
            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found for email: " + email));
            
            logger.info("[ExpertController] User found: {} with plan: {}", user.getEmail(), user.getPlan());
            
            // Tạo JWT token mới với thông tin đã cập nhật
            String newToken = jwtService.generateTokenWithUserInfo(user);
            logger.info("[ExpertController] JWT token generated successfully");
            
            // Trả về token mới và thông tin user
            Map<String, Object> response = new HashMap<>();
            response.put("token", newToken);
            
            // Tạo user object với xử lý null an toàn
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("email", user.getEmail());
            userInfo.put("firstName", user.getFirstName() != null ? user.getFirstName() : "");
            userInfo.put("lastName", user.getLastName() != null ? user.getLastName() : "");
            userInfo.put("role", user.getRole() != null ? user.getRole().name() : "EXPERT");
            userInfo.put("plan", user.getPlan() != null ? user.getPlan() : "FREE");
            userInfo.put("planStartDate", user.getPlanStartDate() != null ? user.getPlanStartDate().toString() : null);
            userInfo.put("planExpiryDate", user.getPlanExpiryDate() != null ? user.getPlanExpiryDate().toString() : null);
            userInfo.put("avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : null);
            userInfo.put("phone", user.getPhone() != null ? user.getPhone() : "");
            
            response.put("user", userInfo);
            
            logger.info("Token refreshed successfully for expert: {} with plan: {}", email, user.getPlan());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error refreshing token: " + e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error refreshing token: " + e.getMessage());
        }
    }

    // Test endpoint để kiểm tra xem controller có hoạt động không
    @GetMapping("/test")
    public ResponseEntity<?> testEndpoint() {
        logger.info("[ExpertController] Test endpoint called");
        Map<String, Object> response = new HashMap<>();
        response.put("message", "ExpertController is working!");
        response.put("timestamp", new Date().toString());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/upload-avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam("avatar") MultipartFile file, Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found for email: " + email));
            
            // Kiểm tra file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File không được để trống");
            }
            
            // Kiểm tra loại file
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body("Chỉ chấp nhận file ảnh");
            }
            
            // Kiểm tra kích thước file (5MB)
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body("File quá lớn. Vui lòng chọn file nhỏ hơn 5MB");
            }
            
            // Tạo thư mục nếu chưa tồn tại
            File uploadDir = new File(AVATAR_UPLOAD_DIR);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }
            
            // Tạo tên file duy nhất
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null) {
                return ResponseEntity.badRequest().body("Tên file không hợp lệ");
            }
            String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String newFilename = UUID.randomUUID().toString() + fileExtension;
            
            // Lưu file
            Path filePath = Paths.get(AVATAR_UPLOAD_DIR + newFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            // Cập nhật avatarUrl trong database
            String avatarUrl = "/uploads/avatars/" + newFilename;
            user.setAvatarUrl(avatarUrl);
            userRepository.save(user);
            
            return ResponseEntity.ok().body(Map.of("avatarUrl", avatarUrl));
            
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Lỗi khi upload file: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi: " + e.getMessage());
        }
    }
} 