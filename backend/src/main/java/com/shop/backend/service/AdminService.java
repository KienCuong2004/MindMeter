package com.shop.backend.service;

import com.shop.backend.model.*;
import com.shop.backend.repository.*;
import com.shop.backend.dto.depression.DepressionTestResultDTO;
import com.shop.backend.dto.depression.CreateQuestionRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@Service
public class AdminService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private DepressionQuestionViRepository questionViRepository;
    
    @Autowired
    private DepressionQuestionEnRepository questionEnRepository;
    
    @Autowired
    private DepressionQuestionOptionViRepository optionViRepository;
    
    @Autowired
    private DepressionQuestionOptionEnRepository optionEnRepository;
    
    @Autowired
    private DepressionTestResultRepository testResultRepository;
    
    @Autowired
    private SystemAnnouncementRepository announcementRepository;
    
    @Autowired
    private AdviceMessageRepository adviceMessageRepository;
    
    // Quản lý người dùng
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    public List<User> getUsersByRole(Role role) {
        return userRepository.findByRole(role);
    }
    
    @Transactional
    public User updateUserStatus(Long userId, String status) {
        return userRepository.findById(userId)
            .map(user -> {
                user.setStatus(User.Status.valueOf(status.toUpperCase()));
                return userRepository.save(user);
            })
            .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
    }
    
    @Transactional
    public User updateUserRole(Long userId, Role role) {
        return userRepository.findById(userId)
            .map(user -> {
                user.setRole(role);
                return userRepository.save(user);
            })
            .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
    }
    
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }
    
    // Quản lý câu hỏi
    public List<DepressionQuestion> getAllQuestions() {
        // Trả về danh sách câu hỏi tiếng Việt làm câu hỏi chính
        List<DepressionQuestionVi> questionsVi = questionViRepository.findAll();
        List<DepressionQuestion> questions = new ArrayList<>();
        
        for (DepressionQuestionVi q : questionsVi) {
            DepressionQuestion question = new DepressionQuestion();
            question.setId(q.getId());
            question.setQuestionText(q.getQuestionText());
            question.setWeight(q.getWeight());
            question.setCategory(q.getCategory());
            question.setOrder(q.getOrder());
            question.setIsActive(q.getIsActive());
            question.setTestKey(q.getTestKey());
            questions.add(question);
        }
        
        return questions;
    }
    
    public List<DepressionQuestionOption> getQuestionOptions(Long questionId) {
        // Trả về options tiếng Việt làm options chính
        List<DepressionQuestionOptionVi> optionsVi = optionViRepository.findByQuestionIdOrderByOrderAsc(questionId);
        List<DepressionQuestionOption> options = new ArrayList<>();
        
        for (DepressionQuestionOptionVi opt : optionsVi) {
            DepressionQuestionOption option = new DepressionQuestionOption();
            option.setId(opt.getId());
            option.setOptionText(opt.getOptionText());
            option.setOptionValue(opt.getOptionValue());
            option.setOrder(opt.getOrder());
            options.add(option);
        }
        
        return options;
    }
    
    // Tối ưu: Lấy options cho nhiều questions cùng lúc thay vì query riêng lẻ
    public Map<Long, List<DepressionQuestionOption>> getQuestionOptionsBatch(List<Long> questionIds) {
        if (questionIds == null || questionIds.isEmpty()) {
            return new HashMap<>();
        }
        
        // Lấy tất cả options cho tất cả question IDs trong 1 query
        List<DepressionQuestionOptionVi> allOptionsVi = new ArrayList<>();
        for (Long questionId : questionIds) {
            allOptionsVi.addAll(optionViRepository.findByQuestionIdOrderByOrderAsc(questionId));
        }
        
        // Nhóm options theo questionId
        Map<Long, List<DepressionQuestionOption>> optionsMap = new HashMap<>();
        for (DepressionQuestionOptionVi opt : allOptionsVi) {
            Long questionId = opt.getQuestion().getId();
            DepressionQuestionOption option = new DepressionQuestionOption();
            option.setId(opt.getId());
            option.setOptionText(opt.getOptionText());
            option.setOptionValue(opt.getOptionValue());
            option.setOrder(opt.getOrder());
            optionsMap.computeIfAbsent(questionId, k -> new ArrayList<>()).add(option);
        }
        
        // Đảm bảo tất cả questionIds đều có trong map (có thể có questions không có options)
        for (Long questionId : questionIds) {
            optionsMap.putIfAbsent(questionId, new ArrayList<>());
        }
        
        return optionsMap;
    }
    
    public List<String> getActiveQuestionCategories() {
        List<String> viCategories = questionViRepository.findDistinctCategories();
        List<String> enCategories = questionEnRepository.findDistinctCategories();
        
        // Merge and deduplicate categories
        List<String> allCategories = new ArrayList<>();
        allCategories.addAll(viCategories);
        allCategories.addAll(enCategories);
        
        return allCategories.stream().distinct().sorted().toList();
    }
    
    @Transactional
    public DepressionQuestion createQuestion(DepressionQuestion question) {
        // Tạo câu hỏi tiếng Việt
        DepressionQuestionVi questionVi = new DepressionQuestionVi();
        questionVi.setQuestionText(question.getQuestionText());
        questionVi.setWeight(question.getWeight());
        questionVi.setCategory(question.getCategory());
        questionVi.setOrder(question.getOrder());
        questionVi.setIsActive(question.getIsActive());
        questionVi.setTestKey(question.getTestKey());
        
        questionVi = questionViRepository.save(questionVi);
        
        // Trả về câu hỏi tiếng Việt làm câu hỏi chính
        DepressionQuestion result = new DepressionQuestion();
        result.setId(questionVi.getId());
        result.setQuestionText(questionVi.getQuestionText());
        result.setWeight(questionVi.getWeight());
        result.setCategory(questionVi.getCategory());
        result.setOrder(questionVi.getOrder());
        result.setIsActive(questionVi.getIsActive());
        result.setTestKey(questionVi.getTestKey());
        
        return result;
    }
    
    @Transactional
    public DepressionQuestion createQuestionWithOptions(CreateQuestionRequest request) {
        // Tạo câu hỏi tiếng Việt
        DepressionQuestionVi questionVi = new DepressionQuestionVi();
        questionVi.setQuestionText(request.getQuestionTextVi() != null ? request.getQuestionTextVi() : request.getQuestionText());
        questionVi.setWeight(request.getWeight() != null ? request.getWeight() : 1);
        questionVi.setCategory(request.getCategory());
        questionVi.setOrder(request.getOrder() != null ? request.getOrder() : 1);
        questionVi.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        questionVi.setTestKey(request.getTestKey() != null ? request.getTestKey() : "DASS-21");
        
        questionVi = questionViRepository.save(questionVi);
        
        // Tạo câu hỏi tiếng Anh
        DepressionQuestionEn questionEn = new DepressionQuestionEn();
        questionEn.setQuestionText(request.getQuestionTextEn() != null ? request.getQuestionTextEn() : request.getQuestionText());
        questionEn.setWeight(request.getWeight() != null ? request.getWeight() : 1);
        questionEn.setCategory(request.getCategory());
        questionEn.setOrder(request.getOrder() != null ? request.getOrder() : 1);
        questionEn.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        questionEn.setTestKey(request.getTestKey() != null ? request.getTestKey() + "-EN" : "DASS-21-EN");
        
        questionEn = questionEnRepository.save(questionEn);
        
        // Tạo các lựa chọn tiếng Việt nếu có
        if (request.getOptionsVi() != null && !request.getOptionsVi().isEmpty()) {
            for (CreateQuestionRequest.QuestionOptionRequest optionRequest : request.getOptionsVi()) {
                DepressionQuestionOptionVi option = new DepressionQuestionOptionVi();
                option.setQuestion(questionVi);
                option.setOptionText(optionRequest.getOptionText());
                option.setOptionValue(optionRequest.getOptionValue());
                option.setOrder(optionRequest.getOrder() != null ? optionRequest.getOrder() : 1);
                optionViRepository.save(option);
            }
        }
        
        // Tạo các lựa chọn tiếng Anh nếu có
        if (request.getOptionsEn() != null && !request.getOptionsEn().isEmpty()) {
            for (CreateQuestionRequest.QuestionOptionRequest optionRequest : request.getOptionsEn()) {
                DepressionQuestionOptionEn option = new DepressionQuestionOptionEn();
                option.setQuestion(questionEn);
                option.setOptionText(optionRequest.getOptionText());
                option.setOptionValue(optionRequest.getOptionValue());
                option.setOrder(optionRequest.getOrder() != null ? optionRequest.getOrder() : 1);
                optionEnRepository.save(option);
            }
        }
        
        // Trả về câu hỏi tiếng Việt làm câu hỏi chính
        DepressionQuestion question = new DepressionQuestion();
        question.setId(questionVi.getId());
        question.setQuestionText(questionVi.getQuestionText());
        question.setWeight(questionVi.getWeight());
        question.setCategory(questionVi.getCategory());
        question.setOrder(questionVi.getOrder());
        question.setIsActive(questionVi.getIsActive());
        question.setTestKey(questionVi.getTestKey());
        
        return question;
    }
    
    @Transactional
    public DepressionQuestion updateQuestion(Long questionId, DepressionQuestion questionDetails) {
        DepressionQuestionVi questionVi = questionViRepository.findById(questionId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy câu hỏi"));
        
        questionVi.setQuestionText(questionDetails.getQuestionText());
        questionVi.setWeight(questionDetails.getWeight());
        questionVi.setIsActive(questionDetails.getIsActive());
        questionVi = questionViRepository.save(questionVi);
        
        // Trả về câu hỏi tiếng Việt làm câu hỏi chính
        DepressionQuestion result = new DepressionQuestion();
        result.setId(questionVi.getId());
        result.setQuestionText(questionVi.getQuestionText());
        result.setWeight(questionVi.getWeight());
        result.setCategory(questionVi.getCategory());
        result.setOrder(questionVi.getOrder());
        result.setIsActive(questionVi.getIsActive());
        result.setTestKey(questionVi.getTestKey());
        
        return result;
    }
    
    @Transactional
    public DepressionQuestion updateQuestionWithOptions(Long questionId, CreateQuestionRequest request) {
        DepressionQuestionVi questionVi = questionViRepository.findById(questionId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy câu hỏi"));

        // Cập nhật câu hỏi tiếng Việt
        questionVi.setQuestionText(request.getQuestionTextVi() != null ? request.getQuestionTextVi() : request.getQuestionText());
        questionVi.setWeight(request.getWeight());
        questionVi.setIsActive(request.getIsActive());
        questionVi.setCategory(request.getCategory());
        questionVi.setOrder(request.getOrder());
        questionVi = questionViRepository.save(questionVi);

        // Tìm và cập nhật câu hỏi tiếng Anh tương ứng
        String testKey = questionVi.getTestKey();
        if (testKey != null) {
            String enTestKey = testKey + "-EN";
            var questionEnOpt = questionEnRepository.findByTestKeyAndOrder(enTestKey, questionVi.getOrder());
            if (questionEnOpt.isPresent()) {
                DepressionQuestionEn questionEn = questionEnOpt.get();
                questionEn.setQuestionText(request.getQuestionTextEn() != null ? request.getQuestionTextEn() : request.getQuestionText());
                questionEn.setWeight(request.getWeight());
                questionEn.setIsActive(request.getIsActive());
                questionEn.setCategory(request.getCategory());
                questionEn.setOrder(request.getOrder());
                questionEnRepository.save(questionEn);
                
                // Xóa đáp án tiếng Anh cũ
                optionEnRepository.deleteByQuestionId(questionEn.getId());
                
                // Thêm đáp án tiếng Anh mới
                if (request.getOptionsEn() != null) {
                    for (CreateQuestionRequest.QuestionOptionRequest optionRequest : request.getOptionsEn()) {
                        DepressionQuestionOptionEn option = new DepressionQuestionOptionEn();
                        option.setQuestion(questionEn);
                        option.setOptionText(optionRequest.getOptionText());
                        option.setOptionValue(optionRequest.getOptionValue());
                        option.setOrder(optionRequest.getOrder());
                        optionEnRepository.save(option);
                    }
                }
            } else {
                // Nếu không tìm thấy câu hỏi tiếng Anh, tạo mới
                DepressionQuestionEn questionEn = new DepressionQuestionEn();
                questionEn.setQuestionText(request.getQuestionTextEn() != null ? request.getQuestionTextEn() : request.getQuestionText());
                questionEn.setWeight(request.getWeight());
                questionEn.setIsActive(request.getIsActive());
                questionEn.setCategory(request.getCategory());
                questionEn.setOrder(request.getOrder());
                questionEn.setTestKey(enTestKey);
                questionEn = questionEnRepository.save(questionEn);
                
                // Thêm đáp án tiếng Anh mới
                if (request.getOptionsEn() != null) {
                    for (CreateQuestionRequest.QuestionOptionRequest optionRequest : request.getOptionsEn()) {
                        DepressionQuestionOptionEn option = new DepressionQuestionOptionEn();
                        option.setQuestion(questionEn);
                        option.setOptionText(optionRequest.getOptionText());
                        option.setOptionValue(optionRequest.getOptionValue());
                        option.setOrder(optionRequest.getOrder());
                        optionEnRepository.save(option);
                    }
                }
            }
        }

        // Xóa đáp án tiếng Việt cũ
        optionViRepository.deleteByQuestionId(questionId);

        // Thêm đáp án tiếng Việt mới
        if (request.getOptionsVi() != null) {
            for (CreateQuestionRequest.QuestionOptionRequest optionRequest : request.getOptionsVi()) {
                DepressionQuestionOptionVi option = new DepressionQuestionOptionVi();
                option.setQuestion(questionVi);
                option.setOptionText(optionRequest.getOptionText());
                option.setOptionValue(optionRequest.getOptionValue());
                option.setOrder(optionRequest.getOrder());
                optionViRepository.save(option);
            }
        }
        
        // Trả về câu hỏi tiếng Việt làm câu hỏi chính
        DepressionQuestion result = new DepressionQuestion();
        result.setId(questionVi.getId());
        result.setQuestionText(questionVi.getQuestionText());
        result.setWeight(questionVi.getWeight());
        result.setCategory(questionVi.getCategory());
        result.setOrder(questionVi.getOrder());
        result.setIsActive(questionVi.getIsActive());
        result.setTestKey(questionVi.getTestKey());
        
        return result;
    }
    
    @Transactional
    public void deleteQuestion(Long questionId) {
        questionViRepository.deleteById(questionId);
        questionEnRepository.deleteById(questionId);
    }
    
    @Transactional
    public void toggleQuestionStatus(Long questionId) {
        questionViRepository.findById(questionId)
            .ifPresent(question -> {
                question.setIsActive(!question.getIsActive());
                questionViRepository.save(question);
            });
        
        questionEnRepository.findById(questionId)
            .ifPresent(question -> {
                question.setIsActive(!question.getIsActive());
                questionEnRepository.save(question);
            });
    }
    
    // Quản lý thông báo hệ thống
    public List<SystemAnnouncement> getAllAnnouncements() {
        return announcementRepository.findAll();
    }
    
    public List<SystemAnnouncement> getActiveAnnouncements() {
        return announcementRepository.findByIsActiveTrueOrderByCreatedAtDesc();
    }
    
    @Transactional
    public SystemAnnouncement createAnnouncement(SystemAnnouncement announcement) {
        return announcementRepository.save(announcement);
    }
    
    @Transactional
    public SystemAnnouncement updateAnnouncement(Long announcementId, SystemAnnouncement announcementDetails) {
        return announcementRepository.findById(announcementId)
            .map(announcement -> {
                announcement.setTitle(announcementDetails.getTitle());
                announcement.setContent(announcementDetails.getContent());
                announcement.setAnnouncementType(announcementDetails.getAnnouncementType());
                announcement.setIsActive(announcementDetails.getIsActive());
                return announcementRepository.save(announcement);
            })
            .orElseThrow(() -> new RuntimeException("Không tìm thấy thông báo"));
    }
    
    @Transactional
    public void deleteAnnouncement(Long announcementId) {
        announcementRepository.deleteById(announcementId);
    }
    
    @Transactional
    public void toggleAnnouncementStatus(Long announcementId) {
        announcementRepository.findById(announcementId)
            .ifPresent(announcement -> {
                announcement.setIsActive(!announcement.getIsActive());
                announcementRepository.save(announcement);
            });
    }
    
    	// Thống kê hệ thống
	@org.springframework.cache.annotation.Cacheable(value = "systemStats", key = "'overall'")
	public Map<String, Object> getSystemStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        // Thống kê người dùng
        long totalUsers = userRepository.count();
        long studentCount = userRepository.countByRole(Role.STUDENT);
        long expertCount = userRepository.countByRole(Role.EXPERT);
        long adminCount = userRepository.countByRole(Role.ADMIN);
        
        stats.put("totalUsers", totalUsers);
        stats.put("studentCount", studentCount);
        stats.put("expertCount", expertCount);
        stats.put("adminCount", adminCount);
        
        // Thống kê bài test
        long totalTests = testResultRepository.count();
        long minimalTests = testResultRepository.countBySeverityLevel(DepressionTestResult.SeverityLevel.MINIMAL);
        long mildTests = testResultRepository.countBySeverityLevel(DepressionTestResult.SeverityLevel.MILD);
        long moderateTests = testResultRepository.countBySeverityLevel(DepressionTestResult.SeverityLevel.MODERATE);
        long severeTests = testResultRepository.countBySeverityLevel(DepressionTestResult.SeverityLevel.SEVERE);
        
        stats.put("totalTests", totalTests);
        stats.put("minimalTests", minimalTests);
        stats.put("mildTests", mildTests);
        stats.put("moderateTests", moderateTests);
        stats.put("severeTests", severeTests);
        
        // Tính tỷ lệ
        if (totalTests > 0) {
            stats.put("minimalPercentage", (double) minimalTests / totalTests * 100);
            stats.put("mildPercentage", (double) mildTests / totalTests * 100);
            stats.put("moderatePercentage", (double) moderateTests / totalTests * 100);
            stats.put("severePercentage", (double) severeTests / totalTests * 100);
        }
        
        // Thống kê câu hỏi
        long totalQuestions = questionViRepository.count() + questionEnRepository.count();
        long activeQuestions = questionViRepository.findByIsActiveTrue().size() + questionEnRepository.findByIsActiveTrue().size();
        
        stats.put("totalQuestions", totalQuestions);
        stats.put("activeQuestions", activeQuestions);
        
        // Thống kê tổng số lời khuyên đã gửi
        long totalAdvices = adviceMessageRepository.count();
        stats.put("totalAdvices", totalAdvices);
        return stats;
    }
    
    	// Lấy danh sách kết quả test gần đây
	@org.springframework.cache.annotation.Cacheable(value = "recentTestResults", key = "'recent'")
	public List<DepressionTestResult> getRecentTestResults(int limit) {
		return testResultRepository.findTop10ByOrderByTestedAtDesc();
	}
    
    public List<DepressionTestResultDTO> getAllTestResultDTOs() {
        List<DepressionTestResult> results = testResultRepository.findAllByOrderByTestedAtDesc();
        return results.stream().map(result -> {
            DepressionTestResultDTO dto = new DepressionTestResultDTO();
            dto.setId(result.getId());
            dto.setTotalScore(result.getTotalScore());
            dto.setSeverityLevel(result.getSeverityLevel() != null ? result.getSeverityLevel().name() : null);
            dto.setTestedAt(result.getTestedAt());
            dto.setDiagnosis(result.getDiagnosis());
            if (result.getUser() != null) {
                dto.setStudentName(result.getUser().getFirstName() + " " + result.getUser().getLastName());
                dto.setEmail(result.getUser().getEmail());
                dto.setUserId(result.getUser().getId()); // Thêm trường userId
            }
            dto.setTestType(result.getTestType());
            return dto;
        }).toList();
    }
    
    @Transactional
    public void deleteTestResult(Long id) {
        testResultRepository.deleteById(id);
    }
    
    // Thống kê số lượt test theo ngày (và số severe test) trong khoảng thời gian
    public Map<String, Object> getTestCountByDateRange(int days) {
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate from = today.minusDays(days - 1);
        java.time.LocalDateTime fromDateTime = from.atStartOfDay();
        java.time.LocalDateTime toDateTime = today.atTime(23, 59, 59);
        // Lấy tổng số test theo ngày
        List<Object[]> totalList = testResultRepository.countTestsByDateRange(fromDateTime, toDateTime);
        // Lấy số severe test theo ngày
        List<Object[]> severeList = testResultRepository.countSevereTestsByDateRange(fromDateTime, toDateTime);
        // Map ngày -> count
        Map<String, Integer> totalMap = new java.util.HashMap<>();
        for (Object[] row : totalList) {
            totalMap.put(row[0].toString(), ((Number)row[1]).intValue());
        }
        Map<String, Integer> severeMap = new java.util.HashMap<>();
        for (Object[] row : severeList) {
            severeMap.put(row[0].toString(), ((Number)row[1]).intValue());
        }
        // Build kết quả đủ ngày (nếu ngày nào không có thì count = 0)
        java.util.List<String> dates = new java.util.ArrayList<>();
        java.util.List<Integer> totalTests = new java.util.ArrayList<>();
        java.util.List<Integer> severeTests = new java.util.ArrayList<>();
        for (int i = 0; i < days; i++) {
            java.time.LocalDate d = from.plusDays(i);
            String key = d.toString();
            dates.add(key);
            totalTests.add(totalMap.getOrDefault(key, 0));
            severeTests.add(severeMap.getOrDefault(key, 0));
        }
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("dates", dates);
        result.put("totalTests", totalTests);
        result.put("severeTests", severeTests);
        return result;
    }
    

} 