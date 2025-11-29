package com.shop.backend.controller;

import com.shop.backend.model.*;
import com.shop.backend.service.AdminService;
import com.shop.backend.dto.SystemAnnouncementDTO;
import com.shop.backend.dto.depression.DepressionTestResultDTO;
import com.shop.backend.dto.UserDTO;
import com.shop.backend.dto.depression.DepressionQuestionDTO;
import com.shop.backend.dto.depression.DepressionQuestionOptionDTO;
import com.shop.backend.dto.depression.CreateQuestionRequest;
import com.shop.backend.repository.DepressionTestAnswerRepository;
import com.shop.backend.repository.DepressionQuestionViRepository;
import com.shop.backend.repository.DepressionQuestionEnRepository;
import com.shop.backend.repository.DepressionQuestionOptionViRepository;
import com.shop.backend.repository.DepressionQuestionOptionEnRepository;
import com.shop.backend.model.DepressionQuestionOption;
import com.shop.backend.model.DepressionQuestionOptionVi;
import com.shop.backend.model.DepressionQuestionOptionEn;
import com.shop.backend.repository.UserRepository;
import com.shop.backend.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    
    @Autowired
    private AdminService adminService;
    
    @Autowired
    private DepressionTestAnswerRepository depressionTestAnswerRepository;
    
    @Autowired
    private DepressionQuestionViRepository depressionQuestionViRepository;
    
    @Autowired
    private DepressionQuestionEnRepository depressionQuestionEnRepository;
    
    @Autowired
    private DepressionQuestionOptionViRepository depressionQuestionOptionViRepository;
    
    @Autowired
    private DepressionQuestionOptionEnRepository depressionQuestionOptionEnRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private JwtService jwtService;
    
    // Quản lý người dùng
    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<User> users = adminService.getAllUsers();
        List<UserDTO> dtos = users.stream().map(user -> {
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
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/users/role/{role}")
    public ResponseEntity<List<UserDTO>> getUsersByRole(@PathVariable String role) {
        try {
            Role userRole = Role.valueOf(role.toUpperCase());
            List<User> users = adminService.getUsersByRole(userRole);
            List<UserDTO> dtos = users.stream().map(user -> {
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
                return dto;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/users/{userId}/status")
    public ResponseEntity<UserDTO> updateUserStatus(
            @PathVariable Long userId,
            @RequestParam String status) {
        try {
            User user = adminService.updateUserStatus(userId, status);
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
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PutMapping("/users/{userId}/role")
    public ResponseEntity<UserDTO> updateUserRole(
            @PathVariable Long userId,
            @RequestParam String role) {
        try {
            Role userRole = Role.valueOf(role.toUpperCase());
            User user = adminService.updateUserRole(userId, userRole);
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
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    // Quản lý câu hỏi
    @GetMapping("/questions")
    public ResponseEntity<List<DepressionQuestionDTO>> getAllQuestions(
            @RequestHeader(value = "Accept-Language", defaultValue = "vi") String acceptLanguage) {
        
        // Lấy tất cả câu hỏi từ cả hai bảng
        List<DepressionQuestionVi> questionsVi = depressionQuestionViRepository.findAll();
        List<DepressionQuestionEn> questionsEn = depressionQuestionEnRepository.findAll();
        
        // Lấy tất cả question IDs để batch query options
        List<Long> questionIdsVi = questionsVi.stream()
            .map(DepressionQuestionVi::getId)
            .collect(Collectors.toList());
        List<Long> questionIdsEn = questionsEn.stream()
            .map(DepressionQuestionEn::getId)
            .collect(Collectors.toList());
        
        // Batch query tất cả options cho tất cả questions
        Map<Long, List<DepressionQuestionOptionVi>> allOptionsViMap = new HashMap<>();
        Map<Long, List<DepressionQuestionOptionEn>> allOptionsEnMap = new HashMap<>();
        
        for (Long questionId : questionIdsVi) {
            allOptionsViMap.put(questionId, depressionQuestionOptionViRepository.findByQuestionIdOrderByOrderAsc(questionId));
        }
        for (Long questionId : questionIdsEn) {
            allOptionsEnMap.put(questionId, depressionQuestionOptionEnRepository.findByQuestionIdOrderByOrderAsc(questionId));
        }
        
        // Nhóm questions theo testKey để tìm câu hỏi tương ứng
        Map<String, List<DepressionQuestionVi>> viQuestionsByBaseKey = new HashMap<>();
        Map<String, List<DepressionQuestionEn>> enQuestionsByBaseKey = new HashMap<>();
        
        for (DepressionQuestionVi q : questionsVi) {
            String testKey = q.getTestKey();
            if (testKey != null) {
                viQuestionsByBaseKey.computeIfAbsent(testKey, k -> new ArrayList<>()).add(q);
            }
        }
        
        for (DepressionQuestionEn q : questionsEn) {
            String testKey = q.getTestKey();
            if (testKey != null) {
                // Chuyển đổi testKey từ "DASS-21-EN" thành "DASS-21" để mapping đúng
                String baseKey = testKey.endsWith("-EN") ? testKey.substring(0, testKey.length() - 3) : testKey;
                enQuestionsByBaseKey.computeIfAbsent(baseKey, k -> new ArrayList<>()).add(q);
            }
        }
        
        // Tạo DTOs cho câu hỏi tiếng Việt
        List<DepressionQuestionDTO> dtosVi = questionsVi.stream().map(question -> {
            DepressionQuestionDTO dto = new DepressionQuestionDTO();
            dto.setId(question.getId());
            dto.setQuestionText(question.getQuestionText());
            dto.setWeight(question.getWeight());
            dto.setCategory(question.getCategory());
            dto.setTestKey(question.getTestKey());
            dto.setOrder(question.getOrder());
            dto.setIsActive(question.getIsActive());
            
            // Lấy câu hỏi tiếng Anh tương ứng
            String questionTextEn = findEnglishQuestionFromCache(question, enQuestionsByBaseKey);
            dto.setQuestionTextEn(questionTextEn);
            dto.setQuestionTextVi(question.getQuestionText());
            
            
            // Lấy options và convert sang DTO để tránh circular reference
            List<DepressionQuestionOptionVi> optionsVi = allOptionsViMap.getOrDefault(question.getId(), new ArrayList<>());
            List<DepressionQuestionOptionDTO> optionsViDTO = optionsVi.stream()
                .map(opt -> {
                    DepressionQuestionOptionDTO optDTO = new DepressionQuestionOptionDTO();
                    optDTO.setId(opt.getId());
                    optDTO.setOptionText(opt.getOptionText());
                    optDTO.setOptionValue(opt.getOptionValue());
                    optDTO.setOrder(opt.getOrder());
                    return optDTO;
                })
                .collect(Collectors.toList());
            dto.setOptionsVi(optionsViDTO);
            
            // Lấy options tiếng Anh tương ứng và convert sang DTO
            List<DepressionQuestionOptionEn> optionsEn = findEnglishOptionsFromCache(question, enQuestionsByBaseKey, allOptionsEnMap);
            List<DepressionQuestionOptionDTO> optionsEnDTO = optionsEn.stream()
                .map(opt -> {
                    DepressionQuestionOptionDTO optDTO = new DepressionQuestionOptionDTO();
                    optDTO.setId(opt.getId());
                    optDTO.setOptionText(opt.getOptionText());
                    optDTO.setOptionValue(opt.getOptionValue());
                    optDTO.setOrder(opt.getOrder());
                    return optDTO;
                })
                .collect(Collectors.toList());
            dto.setOptionsEn(optionsEnDTO);
            
            return dto;
        }).collect(Collectors.toList());
        
        // Chỉ trả về câu hỏi tiếng Việt
        // Frontend sẽ xử lý việc hiển thị đa ngôn ngữ
        return ResponseEntity.ok(dtosVi);
    }
    
    
    // Hàm tìm câu hỏi tiếng Anh từ cache thay vì query database
    private String findEnglishQuestionFromCache(DepressionQuestionVi question, Map<String, List<DepressionQuestionEn>> enQuestionsByBaseKey) {
        try {
            String testKey = question.getTestKey();
            Integer order = question.getOrder();
            
            
            // Chỉ tìm câu hỏi tiếng Anh nếu câu hỏi hiện tại là tiếng Việt (không có -EN)
            if (testKey != null && !testKey.endsWith("-EN")) {
                // Tìm trong enQuestionsByBaseKey để lấy câu hỏi tiếng Anh
                // enQuestionsByBaseKey đã được map với baseKey (không có -EN)
                List<DepressionQuestionEn> enQuestions = enQuestionsByBaseKey.get(testKey);
                
                if (enQuestions != null) {
                    // Tìm câu hỏi có order khớp, ưu tiên câu hỏi mới hơn (ID lớn hơn)
                    DepressionQuestionEn foundQuestion = null;
                    for (DepressionQuestionEn enQuestion : enQuestions) {
                        if (enQuestion.getOrder().equals(order)) {
                            if (foundQuestion == null || enQuestion.getId() > foundQuestion.getId()) {
                                foundQuestion = enQuestion;
                            }
                        }
                    }
                    if (foundQuestion != null) {
                        return foundQuestion.getQuestionText();
                    }
                }
            }
            
            return null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
    
    
    // Hàm tìm options tiếng Anh từ cache
    private List<DepressionQuestionOptionEn> findEnglishOptionsFromCache(DepressionQuestionVi question, 
            Map<String, List<DepressionQuestionEn>> enQuestionsByBaseKey, 
            Map<Long, List<DepressionQuestionOptionEn>> allOptionsEnMap) {
        try {
            String testKey = question.getTestKey();
            Integer order = question.getOrder();
            
            if (testKey != null && !testKey.endsWith("-EN")) {
                // Tìm trong enQuestionsByBaseKey để lấy câu hỏi tiếng Anh
                // enQuestionsByBaseKey đã được map với baseKey (không có -EN)
                List<DepressionQuestionEn> enQuestions = enQuestionsByBaseKey.get(testKey);
                
                if (enQuestions != null) {
                    for (DepressionQuestionEn enQuestion : enQuestions) {
                        if (enQuestion.getOrder().equals(order)) {
                            return allOptionsEnMap.getOrDefault(enQuestion.getId(), new ArrayList<>());
                        }
                    }
                }
            }
            return new ArrayList<>();
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
    
    @PostMapping("/questions")
    public ResponseEntity<DepressionQuestionDTO> createQuestion(@RequestBody CreateQuestionRequest request) {
        DepressionQuestion created = adminService.createQuestionWithOptions(request);
        DepressionQuestionDTO dto = new DepressionQuestionDTO();
        dto.setId(created.getId());
        dto.setQuestionText(created.getQuestionText());
        dto.setWeight(created.getWeight());
        dto.setCategory(created.getCategory());
        dto.setOrder(created.getOrder());
        dto.setIsActive(created.getIsActive());
        
        // Set đa ngôn ngữ từ request
        dto.setQuestionTextEn(request.getQuestionTextEn());
        dto.setQuestionTextVi(request.getQuestionTextVi());
        
        // Lấy danh sách đáp án cho câu hỏi vừa tạo
        List<DepressionQuestionOption> options = adminService.getQuestionOptions(created.getId());
        dto.setOptions(options);
        
        // Set options đa ngôn ngữ từ request
        if (request.getOptionsEn() != null) {
            // Convert options từ QuestionOptionRequest sang DepressionQuestionOptionDTO
            List<DepressionQuestionOptionDTO> optionsEn = request.getOptionsEn().stream()
                .map(opt -> {
                    DepressionQuestionOptionDTO option = new DepressionQuestionOptionDTO();
                    option.setOptionText(opt.getOptionText());
                    option.setOptionValue(opt.getOptionValue());
                    option.setOrder(opt.getOrder());
                    return option;
                })
                .collect(Collectors.toList());
            dto.setOptionsEn(optionsEn);
        }
        
        if (request.getOptionsVi() != null) {
            // Convert options từ QuestionOptionRequest sang DepressionQuestionOptionDTO
            List<DepressionQuestionOptionDTO> optionsVi = request.getOptionsVi().stream()
                .map(opt -> {
                    DepressionQuestionOptionDTO option = new DepressionQuestionOptionDTO();
                    option.setOptionText(opt.getOptionText());
                    option.setOptionValue(opt.getOptionValue());
                    option.setOrder(opt.getOrder());
                    return option;
                })
                .collect(Collectors.toList());
            dto.setOptionsVi(optionsVi);
        }
        
        return ResponseEntity.ok(dto);
    }
    
    @PutMapping("/questions/{questionId}")
    public ResponseEntity<DepressionQuestionDTO> updateQuestion(
            @PathVariable Long questionId,
            @RequestBody CreateQuestionRequest request) {
        try {
            DepressionQuestion updated = adminService.updateQuestionWithOptions(questionId, request);
            DepressionQuestionDTO dto = new DepressionQuestionDTO();
            dto.setId(updated.getId());
            dto.setQuestionText(updated.getQuestionText());
            dto.setWeight(updated.getWeight());
            dto.setCategory(updated.getCategory());
            dto.setOrder(updated.getOrder());
            dto.setIsActive(updated.getIsActive());
            
            // Set đa ngôn ngữ từ request
            dto.setQuestionTextEn(request.getQuestionTextEn());
            dto.setQuestionTextVi(request.getQuestionTextVi());
            
            // Lấy danh sách đáp án cho câu hỏi
            List<DepressionQuestionOption> options = adminService.getQuestionOptions(updated.getId());
            dto.setOptions(options);
            
            // Set options đa ngôn ngữ từ request
            if (request.getOptionsEn() != null) {
                // Convert options từ QuestionOptionRequest sang DepressionQuestionOptionDTO
                List<DepressionQuestionOptionDTO> optionsEn = request.getOptionsEn().stream()
                    .map(opt -> {
                        DepressionQuestionOptionDTO option = new DepressionQuestionOptionDTO();
                        option.setOptionText(opt.getOptionText());
                        option.setOptionValue(opt.getOptionValue());
                        option.setOrder(opt.getOrder());
                        return option;
                    })
                    .collect(Collectors.toList());
                dto.setOptionsEn(optionsEn);
            }
            
            if (request.getOptionsVi() != null) {
                // Convert options từ QuestionOptionRequest sang DepressionQuestionOptionDTO
                List<DepressionQuestionOptionDTO> optionsVi = request.getOptionsVi().stream()
                    .map(opt -> {
                        DepressionQuestionOptionDTO option = new DepressionQuestionOptionDTO();
                        option.setOptionText(opt.getOptionText());
                        option.setOptionValue(opt.getOptionValue());
                        option.setOrder(opt.getOrder());
                        return option;
                    })
                    .collect(Collectors.toList());
                dto.setOptionsVi(optionsVi);
            }
            
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/questions/{questionId}")
    public ResponseEntity<?> deleteQuestion(@PathVariable Long questionId) {
        try {
            adminService.deleteQuestion(questionId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/questions/{questionId}/toggle")
    public ResponseEntity<?> toggleQuestionStatus(@PathVariable Long questionId) {
        adminService.toggleQuestionStatus(questionId);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/questions/categories")
    public ResponseEntity<List<String>> getQuestionCategories() {
        List<String> categories = adminService.getActiveQuestionCategories();
        return ResponseEntity.ok(categories);
    }
    
    // Quản lý thông báo hệ thống
    @GetMapping("/announcements")
    public ResponseEntity<List<SystemAnnouncementDTO>> getAllAnnouncements() {
        List<SystemAnnouncementDTO> dtos = adminService.getAllAnnouncements().stream().map(a -> {
            SystemAnnouncementDTO dto = new SystemAnnouncementDTO();
            dto.setId(a.getId());
            dto.setTitle(a.getTitle());
            dto.setContent(a.getContent());
            dto.setAnnouncementType(a.getAnnouncementType() != null ? a.getAnnouncementType().name() : null);
            dto.setIsActive(a.getIsActive());
            dto.setCreatedAt(a.getCreatedAt());
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/announcements/active")
    public ResponseEntity<List<SystemAnnouncementDTO>> getActiveAnnouncements() {
        List<SystemAnnouncementDTO> dtos = adminService.getActiveAnnouncements().stream().map(a -> {
            SystemAnnouncementDTO dto = new SystemAnnouncementDTO();
            dto.setId(a.getId());
            dto.setTitle(a.getTitle());
            dto.setContent(a.getContent());
            dto.setAnnouncementType(a.getAnnouncementType() != null ? a.getAnnouncementType().name() : null);
            dto.setIsActive(a.getIsActive());
            dto.setCreatedAt(a.getCreatedAt());
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @PostMapping("/announcements")
    public ResponseEntity<SystemAnnouncementDTO> createAnnouncement(@RequestBody SystemAnnouncement announcement) {
        SystemAnnouncement created = adminService.createAnnouncement(announcement);
        SystemAnnouncementDTO dto = new SystemAnnouncementDTO();
        dto.setId(created.getId());
        dto.setTitle(created.getTitle());
        dto.setContent(created.getContent());
        dto.setAnnouncementType(created.getAnnouncementType() != null ? created.getAnnouncementType().name() : null);
        dto.setIsActive(created.getIsActive());
        dto.setCreatedAt(created.getCreatedAt());
        return ResponseEntity.ok(dto);
    }
    
    @PutMapping("/announcements/{announcementId}")
    public ResponseEntity<SystemAnnouncement> updateAnnouncement(
            @PathVariable Long announcementId,
            @RequestBody SystemAnnouncement announcementDetails) {
        try {
            SystemAnnouncement updated = adminService.updateAnnouncement(announcementId, announcementDetails);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/announcements/{announcementId}")
    public ResponseEntity<?> deleteAnnouncement(@PathVariable Long announcementId) {
        try {
            adminService.deleteAnnouncement(announcementId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/announcements/{announcementId}/toggle")
    public ResponseEntity<?> toggleAnnouncementStatus(@PathVariable Long announcementId) {
        adminService.toggleAnnouncementStatus(announcementId);
        return ResponseEntity.ok().build();
    }
    
    // Thống kê hệ thống
    @GetMapping("/statistics")
    @PreAuthorize("hasAnyRole('ADMIN','EXPERT')")
    public ResponseEntity<Map<String, Object>> getSystemStatistics() {
        try {
            Map<String, Object> stats = adminService.getSystemStatistics();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/test-results/recent")
    @PreAuthorize("hasAnyRole('ADMIN','EXPERT')")
    public ResponseEntity<List<DepressionTestResultDTO>> getRecentTestResults() {
        List<DepressionTestResult> results = adminService.getRecentTestResults(10);
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
    }
    
    @GetMapping("/test-results")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DepressionTestResultDTO>> getAllTestResults() {
        List<DepressionTestResultDTO> results = adminService.getAllTestResultDTOs();
        return ResponseEntity.ok(results);
    }
    
    @DeleteMapping("/test-results/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteTestResult(@PathVariable Long id) {
        try {
            adminService.deleteTestResult(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/test-results/{testResultId}/answers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AnswerDetailDTO>> getTestAnswers(@PathVariable Long testResultId) {
        List<com.shop.backend.model.DepressionTestAnswer> answers = depressionTestAnswerRepository.findByTestResultId(testResultId);
        List<AnswerDetailDTO> result = answers.stream().map(ans -> {
            AnswerDetailDTO dto = new AnswerDetailDTO();
            dto.setQuestionId(ans.getQuestionId());
            dto.setAnswerValue(ans.getAnswerValue());
            
            // Lấy câu hỏi dựa trên language và question_table
            String questionTextEn = null;
            String questionTextVi = null;
            
            try {
                if (ans.getLanguage() == com.shop.backend.model.DepressionTestAnswer.Language.EN) {
                    // Câu hỏi hiện tại là tiếng Anh
                    var questionEnOpt = depressionQuestionEnRepository.findById(ans.getQuestionId());
                    if (questionEnOpt.isPresent()) {
                        questionTextEn = questionEnOpt.get().getQuestionText();
                        // Tìm câu hỏi tiếng Việt tương ứng
                        questionTextVi = findVietnameseQuestionFromEn(questionEnOpt.get());
                    }
                } else {
                    // Câu hỏi hiện tại là tiếng Việt
                    var questionViOpt = depressionQuestionViRepository.findById(ans.getQuestionId());
                    if (questionViOpt.isPresent()) {
                        questionTextVi = questionViOpt.get().getQuestionText();
                        // Tìm câu hỏi tiếng Anh tương ứng
                        questionTextEn = findEnglishQuestionFromVi(questionViOpt.get());
                    }
                }
            } catch (Exception e) {
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
    
    // Hàm tìm câu hỏi tiếng Việt từ câu hỏi tiếng Anh
    private String findVietnameseQuestionFromEn(com.shop.backend.model.DepressionQuestionEn questionEn) {
        try {
            String testKey = questionEn.getTestKey();
            Integer order = questionEn.getOrder();
            
            // Tìm câu hỏi tiếng Việt tương ứng
            if (testKey != null && testKey.endsWith("-EN")) {
                String baseTestKey = testKey.substring(0, testKey.length() - 3);
                var viQuestionOpt = depressionQuestionViRepository.findByTestKeyAndOrder(baseTestKey, order);
                if (viQuestionOpt.isPresent()) {
                    return viQuestionOpt.get().getQuestionText();
                }
            }
        } catch (Exception e) {
            // Log error nếu cần
        }
        return null;
    }
    
    // Hàm tìm câu hỏi tiếng Anh từ câu hỏi tiếng Việt
    private String findEnglishQuestionFromVi(com.shop.backend.model.DepressionQuestionVi questionVi) {
        try {
            String testKey = questionVi.getTestKey();
            Integer order = questionVi.getOrder();
            
            // Tìm câu hỏi tiếng Anh tương ứng
            String enTestKey = testKey + "-EN";
            var enQuestionOpt = depressionQuestionEnRepository.findByTestKeyAndOrder(enTestKey, order);
            if (enQuestionOpt.isPresent()) {
                return enQuestionOpt.get().getQuestionText();
            }
        } catch (Exception e) {
            // Log error nếu cần
        }
        return null;
    }
    
    
    public static class AnswerDetailDTO {
        private Long questionId;
        private String questionText;
        private Integer answerValue;
        private String questionTextEn;
        private String questionTextVi;
        
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
    
    // Thống kê số lượt test theo ngày (và số severe test)
    @GetMapping("/statistics/test-count-by-date")
    @PreAuthorize("hasAnyRole('ADMIN','EXPERT')")
    public ResponseEntity<Map<String, Object>> getTestCountByDate(@RequestParam(defaultValue = "14") int days) {
        Map<String, Object> result = adminService.getTestCountByDateRange(days);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/profile")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> getAdminProfile() {
        // Lấy user từ SecurityContext thay vì @AuthenticationPrincipal
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.badRequest().build();
        }
        
        var userDetails = (org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal();
        String email = userDetails.getUsername();
        
        // Tìm user trong database
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        User user = userOpt.get();
        
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
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> refreshAdminToken() {
        try {
            // Lấy user từ SecurityContext
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.badRequest().body("Authentication failed");
            }
            
            var userDetails = (org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal();
            String email = userDetails.getUsername();
            
            // Tìm user trong database để lấy thông tin mới nhất
            var userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("User not found");
            }
            
            User user = userOpt.get();
            
            // Tạo JWT token mới với thông tin đã cập nhật
            String newToken = jwtService.generateTokenWithUserInfo(user);
            
            // Trả về token mới và thông tin user
            Map<String, Object> response = new HashMap<>();
            response.put("token", newToken);
            
            // Tạo user object với xử lý null an toàn
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("email", user.getEmail());
            userInfo.put("firstName", user.getFirstName() != null ? user.getFirstName() : "");
            userInfo.put("lastName", user.getLastName() != null ? user.getLastName() : "");
            userInfo.put("role", user.getRole() != null ? user.getRole().name() : "ADMIN");
            userInfo.put("plan", user.getPlan() != null ? user.getPlan() : "FREE");
            userInfo.put("planStartDate", user.getPlanStartDate() != null ? user.getPlanStartDate().toString() : null);
            userInfo.put("planExpiryDate", user.getPlanExpiryDate() != null ? user.getPlanExpiryDate().toString() : null);
            userInfo.put("avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : null);
            userInfo.put("phone", user.getPhone() != null ? user.getPhone() : "");
            
            response.put("user", userInfo);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error refreshing token");
        }
    }
    
    @PutMapping("/profile")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> updateAdminProfile(@RequestBody UserDTO updateRequest) {
        // Lấy user từ SecurityContext thay vì @AuthenticationPrincipal
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.badRequest().build();
        }
        
        var userDetails = (org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal();
        String email = userDetails.getUsername();
        
        // Tìm user trong database
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        User currentUser = userOpt.get();
        
        try {
            // Cập nhật thông tin cơ bản
            if (updateRequest.getFirstName() != null) {
                currentUser.setFirstName(updateRequest.getFirstName());
            }
            if (updateRequest.getLastName() != null) {
                currentUser.setLastName(updateRequest.getLastName());
            }
            if (updateRequest.getPhone() != null) {
                currentUser.setPhone(updateRequest.getPhone());
            }
            
            User updatedUser = userRepository.save(currentUser);
            
            UserDTO dto = new UserDTO();
            dto.setId(updatedUser.getId());
            dto.setFirstName(updatedUser.getFirstName());
            dto.setLastName(updatedUser.getLastName());
            dto.setEmail(updatedUser.getEmail());
            dto.setPhone(updatedUser.getPhone());
            dto.setRole(updatedUser.getRole() != null ? updatedUser.getRole().name() : null);
            dto.setStatus(updatedUser.getStatus() != null ? updatedUser.getStatus().name() : null);
            dto.setAvatarUrl(updatedUser.getAvatarUrl());
            dto.setCreatedAt(updatedUser.getCreatedAt());
            dto.setUpdatedAt(updatedUser.getUpdatedAt());
            dto.setPlan(updatedUser.getPlan());
            dto.setPlanStartDate(updatedUser.getPlanStartDate());
            dto.setPlanExpiryDate(updatedUser.getPlanExpiryDate());
            
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    // Thư mục lưu trữ avatar
    private static final String AVATAR_UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/avatars/";

    @PostMapping("/upload-avatar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> uploadAvatar(@RequestParam("avatar") MultipartFile file) {
        try {
            // Lấy user từ SecurityContext thay vì @AuthenticationPrincipal
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.badRequest().body("Authentication failed");
            }
            
            var userDetails = (org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal();
            String email = userDetails.getUsername();
            
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