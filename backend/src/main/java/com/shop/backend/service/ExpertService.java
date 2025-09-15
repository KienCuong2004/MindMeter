package com.shop.backend.service;

import com.shop.backend.dto.expert.ExpertNoteRequest;
import com.shop.backend.dto.expert.AdviceMessageRequest;
import com.shop.backend.model.*;
import com.shop.backend.repository.*;
import com.shop.backend.dto.depression.DepressionTestResultDTO;
import com.shop.backend.dto.expert.AdviceMessageDTO;
import com.shop.backend.dto.UserDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class ExpertService {
    
    @Autowired
    private ExpertNoteRepository expertNoteRepository;
    
    @Autowired
    private AdviceMessageRepository adviceMessageRepository;
    
    @Autowired
    private DepressionTestResultRepository testResultRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    // Lấy danh sách tất cả kết quả test của học sinh
    public List<DepressionTestResult> getAllTestResults() {
        return testResultRepository.findAllByOrderByTestedAtDesc();
    }
    
    // Lấy danh sách kết quả test theo mức độ nghiêm trọng
    public List<DepressionTestResult> getTestResultsBySeverity(DepressionTestResult.SeverityLevel severityLevel) {
        return testResultRepository.findBySeverityLevel(severityLevel);
    }
    
    // Lấy lịch sử test của một học sinh cụ thể
    public List<DepressionTestResult> getStudentTestHistory(Long studentId) {
        return testResultRepository.findByUserIdOrderByTestedAtDesc(studentId);
    }
    
    // Lấy danh sách tất cả kết quả test của học sinh (dạng DTO)
    public List<DepressionTestResultDTO> getAllTestResultDTOs() {
        List<DepressionTestResult> results = testResultRepository.findAllByOrderByTestedAtDesc();
        return results.stream().map(result -> {
            DepressionTestResultDTO dto = new DepressionTestResultDTO();
            dto.setId(result.getId());
            if (result.getUser() != null) {
                dto.setStudentName(result.getUser().getFirstName() + " " + result.getUser().getLastName());
            } else {
                dto.setStudentName("");
            }
            dto.setTotalScore(result.getTotalScore());
            dto.setSeverityLevel(result.getSeverityLevel() != null ? result.getSeverityLevel().name() : "");
            dto.setTestedAt(result.getTestedAt());
            dto.setDiagnosis(result.getDiagnosis());
            dto.setEmail(result.getUser() != null ? result.getUser().getEmail() : "");
            dto.setUserId(result.getUser() != null ? result.getUser().getId() : null);
            dto.setTestType(result.getTestType());
            return dto;
        }).toList();
    }
    
    // Tạo nhận xét cho học sinh
    @Transactional
    public ExpertNote createNote(Long expertId, ExpertNoteRequest request) {
        ExpertNote note = new ExpertNote();
        note.setExpert(new User());
        note.getExpert().setId(expertId);
        note.setStudent(new User());
        note.getStudent().setId(request.getStudentId());
        
        if (request.getTestResultId() != null) {
            note.setTestResult(new DepressionTestResult());
            note.getTestResult().setId(request.getTestResultId());
        }
        
        note.setNote(request.getNote());
        note.setNoteType(ExpertNote.NoteType.valueOf(request.getNoteType()));
        
        return expertNoteRepository.save(note);
    }
    
    // Gửi lời khuyên/tư vấn cho học sinh
    @Transactional
    public AdviceMessage sendAdvice(Long expertId, AdviceMessageRequest request) {
        // Lấy sender và receiver từ DB
        User sender = userRepository.findById(expertId)
            .orElseThrow(() -> new RuntimeException("Sender not found"));
        User receiver = userRepository.findById(request.getReceiverId())
            .orElseThrow(() -> new RuntimeException("Receiver not found"));
        AdviceMessage message = new AdviceMessage();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setMessage(request.getMessage());
        message.setMessageType(AdviceMessage.MessageType.valueOf(request.getMessageType()));
        return adviceMessageRepository.save(message);
    }
    
    // Lấy danh sách nhận xét của chuyên gia
    public List<ExpertNote> getExpertNotes(Long expertId) {
        return expertNoteRepository.findByExpertIdOrderByCreatedAtDesc(expertId);
    }
    
    // Lấy danh sách nhận xét cho một học sinh
    public List<ExpertNote> getStudentNotes(Long studentId) {
        return expertNoteRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
    }
    
    // Lấy tin nhắn đã gửi của chuyên gia (trả về DTO)
    public List<AdviceMessageDTO> getSentMessages(Long expertId) {
        List<AdviceMessage> messages = adviceMessageRepository.findBySenderIdOrderBySentAtDesc(expertId);
        return messages.stream().map(msg -> {
            AdviceMessageDTO dto = new AdviceMessageDTO();
            dto.setId(msg.getId());
            dto.setSenderId(msg.getSender() != null ? msg.getSender().getId() : null);
            dto.setReceiverId(msg.getReceiver() != null ? msg.getReceiver().getId() : null);
            dto.setMessage(msg.getMessage());
            dto.setMessageType(msg.getMessageType() != null ? msg.getMessageType().name() : null);
            dto.setIsRead(msg.getIsRead());
            dto.setSentAt(msg.getSentAt());
            return dto;
        }).toList();
    }
    
    // Lấy tin nhắn chưa đọc của học sinh
    public List<AdviceMessage> getUnreadMessages(Long studentId) {
        return adviceMessageRepository.findByReceiverIdAndIsReadFalseOrderBySentAtDesc(studentId);
    }
    
    // Đánh dấu tin nhắn đã đọc
    @Transactional
    public void markMessageAsRead(Long messageId) {
        adviceMessageRepository.findById(messageId).ifPresent(message -> {
            message.setIsRead(true);
            adviceMessageRepository.save(message);
        });
    }

    // Thống kê số lượt test theo ngày (và số severe test) trong khoảng thời gian (tái sử dụng từ admin)
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

    // Thống kê tổng quan cho expert
    public Map<String, Object> getExpertStatistics() {
        Map<String, Object> stats = new java.util.HashMap<>();
        
        // Tổng số test
        long totalTests = testResultRepository.count();
        stats.put("totalTests", totalTests);
        
        // Số test theo mức độ
        long minimalTests = testResultRepository.countBySeverityLevel(DepressionTestResult.SeverityLevel.MINIMAL);
        long mildTests = testResultRepository.countBySeverityLevel(DepressionTestResult.SeverityLevel.MILD);
        long moderateTests = testResultRepository.countBySeverityLevel(DepressionTestResult.SeverityLevel.MODERATE);
        long severeTests = testResultRepository.countBySeverityLevel(DepressionTestResult.SeverityLevel.SEVERE);
        
        stats.put("minimalTests", minimalTests);
        stats.put("mildTests", mildTests);
        stats.put("moderateTests", moderateTests);
        stats.put("severeTests", severeTests);
        
        return stats;
    }

    // Lấy kết quả test gần đây cho expert
    public List<DepressionTestResultDTO> getRecentTestResults() {
        List<DepressionTestResult> results = testResultRepository.findTop10ByOrderByTestedAtDesc();
        // Chỉ lấy 5 kết quả đầu tiên
        return results.stream().limit(5).map(result -> {
            DepressionTestResultDTO dto = new DepressionTestResultDTO();
            dto.setId(result.getId());
            if (result.getUser() != null) {
                dto.setStudentName(result.getUser().getFirstName() + " " + result.getUser().getLastName());
            } else {
                dto.setStudentName("");
            }
            dto.setTotalScore(result.getTotalScore());
            dto.setSeverityLevel(result.getSeverityLevel() != null ? result.getSeverityLevel().name() : "");
            dto.setTestedAt(result.getTestedAt());
            dto.setDiagnosis(result.getDiagnosis());
            dto.setEmail(result.getUser() != null ? result.getUser().getEmail() : "");
            dto.setUserId(result.getUser() != null ? result.getUser().getId() : null);
            dto.setTestType(result.getTestType());
            return dto;
        }).toList();
    }

    public UserDTO getCurrentExpertProfile(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found for email: " + email));
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
        return dto;
    }
} 