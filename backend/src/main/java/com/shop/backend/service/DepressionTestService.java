package com.shop.backend.service;

import com.shop.backend.dto.depression.DepressionTestRequest;
import com.shop.backend.dto.depression.DepressionTestResponse;
import com.shop.backend.dto.depression.DepressionQuestionDTO;
import com.shop.backend.dto.depression.DepressionQuestionOptionDTO;
import com.shop.backend.dto.depression.DepressionTestResultDTO;
import com.shop.backend.model.*;
import com.shop.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
public class DepressionTestService {
    
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
    private DepressionTestAnswerRepository testAnswerRepository;
    
    @Autowired
    private TestResultEmailService emailService;
    
    @Autowired
    private OpenAITestResultService openAITestResultService;
    
    	@org.springframework.cache.annotation.Cacheable(value = "testQuestions", key = "'all-vi'")
	public List<DepressionQuestionVi> getActiveQuestionsVi() {
		return questionViRepository.findByIsActiveTrue();
	}
	
	@org.springframework.cache.annotation.Cacheable(value = "testQuestions", key = "'all-en'")
	public List<DepressionQuestionEn> getActiveQuestionsEn() {
		return questionEnRepository.findByIsActiveTrue();
	}
    
    	@org.springframework.cache.annotation.Cacheable(value = "testQuestions", key = "'dto-vi'")
	public List<DepressionQuestionDTO> getActiveQuestionDTOsVi() {
		List<DepressionQuestionVi> questions = questionViRepository.findByIsActiveTrue();
		return questions.stream().map(q -> {
			DepressionQuestionDTO dto = new DepressionQuestionDTO();
			dto.setId(q.getId());
			dto.setQuestionText(q.getQuestionText());
			dto.setWeight(q.getWeight());
			dto.setCategory(q.getCategory());
			dto.setOrder(q.getOrder());
			// Convert options sang DTO để tránh circular reference
			List<DepressionQuestionOptionVi> optionsVi = optionViRepository.findByQuestionIdOrderByOrderAsc(q.getId());
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
			return dto;
		}).toList();
	}
	
	@org.springframework.cache.annotation.Cacheable(value = "testQuestions", key = "'dto-en'")
	public List<DepressionQuestionDTO> getActiveQuestionDTOsEn() {
		List<DepressionQuestionEn> questions = questionEnRepository.findByIsActiveTrue();
		return questions.stream().map(q -> {
			DepressionQuestionDTO dto = new DepressionQuestionDTO();
			dto.setId(q.getId());
			dto.setQuestionText(q.getQuestionText());
			dto.setWeight(q.getWeight());
			dto.setCategory(q.getCategory());
			dto.setOrder(q.getOrder());
			// Convert options sang DTO để tránh circular reference
			List<DepressionQuestionOptionEn> optionsEn = optionEnRepository.findByQuestionIdOrderByOrderAsc(q.getId());
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
		}).toList();
	}
    
    public List<DepressionQuestionDTO> getActiveQuestionDTOsByTestKeyVi(String testKey) {
        List<DepressionQuestionVi> questions = questionViRepository.findByTestKeyAndIsActiveTrue(testKey);
        return questions.stream().map(q -> {
            DepressionQuestionDTO dto = new DepressionQuestionDTO();
            dto.setId(q.getId());
            dto.setQuestionText(q.getQuestionText());
            dto.setWeight(q.getWeight());
            dto.setCategory(q.getCategory());
            dto.setOrder(q.getOrder());
            // Convert options sang DTO để tránh circular reference
            List<DepressionQuestionOptionVi> optionsVi = optionViRepository.findByQuestionIdOrderByOrderAsc(q.getId());
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
            return dto;
        }).toList();
    }
    
    public List<DepressionQuestionDTO> getActiveQuestionDTOsByTestKeyEn(String testKey) {
        List<DepressionQuestionEn> questions = questionEnRepository.findByTestKeyAndIsActiveTrue(testKey);
        return questions.stream().map(q -> {
            DepressionQuestionDTO dto = new DepressionQuestionDTO();
            dto.setId(q.getId());
            dto.setQuestionText(q.getQuestionText());
            dto.setWeight(q.getWeight());
            dto.setCategory(q.getCategory());
            dto.setOrder(q.getOrder());
            // Convert options sang DTO để tránh circular reference
            List<DepressionQuestionOptionEn> optionsEn = optionEnRepository.findByQuestionIdOrderByOrderAsc(q.getId());
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
        }).toList();
    }
    
    /**
     * Get questions by test key with language support
     * @param testKey The test key (e.g., 'DASS-21', 'DASS-21-EN')
     * @param language The language code ('vi' for Vietnamese, 'en' for English)
     * @return List of questions in the specified language
     */
    public List<DepressionQuestionDTO> getActiveQuestionDTOsByTestKeyAndLanguage(String testKey, String language) {
        // Debug: Log input parameters
        // System.out.println("[DEBUG] getActiveQuestionDTOsByTestKeyAndLanguage called");
        // System.out.println("[DEBUG] Input testKey: " + testKey);
        // System.out.println("[DEBUG] Input language: " + language);
        
        // Determine the appropriate test key based on language
        String actualTestKey = testKey;
        if ("en".equals(language) && !testKey.endsWith("-EN")) {
            // If English is requested but testKey doesn't end with -EN, append it
            actualTestKey = testKey + "-EN";
            // System.out.println("[DEBUG] Appending -EN suffix. New testKey: " + actualTestKey);
        } else if ("vi".equals(language) && testKey.endsWith("-EN")) {
            // If Vietnamese is requested but testKey ends with -EN, remove it
            actualTestKey = testKey.substring(0, testKey.length() - 3);
            // System.out.println("[DEBUG] Removing -EN suffix. New testKey: " + actualTestKey);
        } else {
            // System.out.println("[DEBUG] No suffix change needed. Using testKey: " + actualTestKey);
        }
        
        // System.out.println("[DEBUG] Final testKey for database query: " + actualTestKey);
        
        // Query the appropriate repository based on language
        if ("en".equals(language)) {
            List<DepressionQuestionEn> questions = questionEnRepository.findByTestKeyAndIsActiveTrue(actualTestKey);
            return questions.stream().map(q -> {
                DepressionQuestionDTO dto = new DepressionQuestionDTO();
                dto.setId(q.getId());
                dto.setQuestionText(q.getQuestionText());
                dto.setWeight(q.getWeight());
                dto.setCategory(q.getCategory());
                dto.setOrder(q.getOrder());
                // Convert options sang DTO để tránh circular reference
                List<DepressionQuestionOptionEn> optionsEn = optionEnRepository.findByQuestionIdOrderByOrderAsc(q.getId());
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
            }).toList();
        } else {
            List<DepressionQuestionVi> questions = questionViRepository.findByTestKeyAndIsActiveTrue(actualTestKey);
            return questions.stream().map(q -> {
                DepressionQuestionDTO dto = new DepressionQuestionDTO();
                dto.setId(q.getId());
                dto.setQuestionText(q.getQuestionText());
                dto.setWeight(q.getWeight());
                dto.setCategory(q.getCategory());
                dto.setOrder(q.getOrder());
                // Convert options sang DTO để tránh circular reference
                List<DepressionQuestionOptionVi> optionsVi = optionViRepository.findByQuestionIdOrderByOrderAsc(q.getId());
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
                return dto;
            }).toList();
        }
    }
    
    @Transactional
    public DepressionTestResponse submitTest(Long userId, DepressionTestRequest request) {
        // Calculate total score
        int totalScore = 0;
        for (DepressionTestRequest.QuestionAnswer answer : request.getAnswers()) {
            totalScore += answer.getAnswerValue();
        }
        
        // Prepare answers for AI analysis
        List<Map<String, Object>> answersForAI = new java.util.ArrayList<>();
        String language = request.getLanguage() != null ? request.getLanguage() : "vi";
        
        for (DepressionTestRequest.QuestionAnswer answer : request.getAnswers()) {
            // Get question text for context based on language
            String questionText = "Câu hỏi không xác định";
            String category = "Không xác định";
            
            if ("en".equals(language)) {
                DepressionQuestionEn question = questionEnRepository.findById(answer.getQuestionId()).orElse(null);
                if (question != null) {
                    questionText = question.getQuestionText();
                    category = question.getCategory();
                }
            } else {
                DepressionQuestionVi question = questionViRepository.findById(answer.getQuestionId()).orElse(null);
                if (question != null) {
                    questionText = question.getQuestionText();
                    category = question.getCategory();
                }
            }
            
            Map<String, Object> answerData = new HashMap<>();
            answerData.put("questionText", questionText);
            answerData.put("answerValue", answer.getAnswerValue());
            answerData.put("category", category);
            answerData.put("questionId", answer.getQuestionId());
            answersForAI.add(answerData);
        }
        
        // Get AI-powered analysis
        Map<String, String> aiAnalysis = openAITestResultService.generateTestResultAnalysis(
            request.getTestType(), totalScore, answersForAI
        );
        
        // Use AI results or fallback to default
        String diagnosis = aiAnalysis.getOrDefault("diagnosis", determineDiagnosis(totalScore));
        String severityStr = aiAnalysis.getOrDefault("severity", determineSeverityLevel(totalScore).name());
        String recommendation = aiAnalysis.getOrDefault("recommendation", getRecommendation(determineSeverityLevel(totalScore)));
        
        // Convert severity string to enum
        DepressionTestResult.SeverityLevel severityLevel;
        try {
            severityLevel = DepressionTestResult.SeverityLevel.valueOf(severityStr);
        } catch (IllegalArgumentException e) {
            severityLevel = determineSeverityLevel(totalScore);
        }
        
        // Save test result
        DepressionTestResult testResult = new DepressionTestResult();
        testResult.setTotalScore(totalScore);
        testResult.setDiagnosis(diagnosis);
        testResult.setSeverityLevel(severityLevel);
        testResult.setUser(new User()); // Set user by ID
        testResult.getUser().setId(userId);
        testResult.setRecommendation(recommendation);
        testResult.setTestType(request.getTestType());
        testResult.setLanguage(DepressionTestResult.Language.valueOf(language.toUpperCase()));
        
        testResult = testResultRepository.save(testResult);
        
        // Save individual answers
        for (DepressionTestRequest.QuestionAnswer answer : request.getAnswers()) {
            DepressionTestAnswer testAnswer = new DepressionTestAnswer();
            testAnswer.setTestResult(testResult);
            testAnswer.setQuestionId(answer.getQuestionId());
            testAnswer.setAnswerValue(answer.getAnswerValue());
            testAnswer.setLanguage(DepressionTestAnswer.Language.valueOf(language.toUpperCase()));
            testAnswer.setQuestionTable("en".equals(language) ? 
                DepressionTestAnswer.QuestionTable.DEPRESSION_QUESTIONS_EN : 
                DepressionTestAnswer.QuestionTable.DEPRESSION_QUESTIONS_VI);
            testAnswerRepository.save(testAnswer);
        }
        
        // Create response
        DepressionTestResponse response = new DepressionTestResponse();
        response.setTestResultId(testResult.getId());
        response.setTotalScore(totalScore);
        response.setDiagnosis(diagnosis);
        response.setSeverityLevel(severityLevel.name());
        response.setSeverity(severityLevel.name()); // Thêm setSeverity
        response.setRecommendation(recommendation);
        response.setTestedAt(testResult.getTestedAt());
        response.setShouldContactExpert(severityLevel == DepressionTestResult.SeverityLevel.SEVERE);
        
        // Gửi email kết quả test
        try {
            emailService.sendTestResultEmail(userId, response, request.getTestType());
        } catch (Exception e) {
            // Log error nhưng không ảnh hưởng đến việc submit test
            System.err.println("Failed to send test result email: " + e.getMessage());
        }
        
        return response;
    }
    
    private String determineDiagnosis(int totalScore) {
        if (totalScore <= 4) return "NO_DEPRESSION";
        else if (totalScore <= 9) return "MILD_DEPRESSION";
        else if (totalScore <= 14) return "MODERATE_DEPRESSION";
        else if (totalScore <= 19) return "SEVERE_DEPRESSION";
        else return "VERY_SEVERE_DEPRESSION";
    }
    
    private DepressionTestResult.SeverityLevel determineSeverityLevel(int totalScore) {
        if (totalScore <= 4) return DepressionTestResult.SeverityLevel.MINIMAL;
        else if (totalScore <= 9) return DepressionTestResult.SeverityLevel.MILD;
        else if (totalScore <= 14) return DepressionTestResult.SeverityLevel.MODERATE;
        else return DepressionTestResult.SeverityLevel.SEVERE;
    }
    
    private String getRecommendation(DepressionTestResult.SeverityLevel severityLevel) {
        switch (severityLevel) {
            case MINIMAL:
                return "MINIMAL_DEPRESSION_RECOMMENDATION";
            case MILD:
                return "MILD_DEPRESSION_RECOMMENDATION";
            case MODERATE:
                return "MODERATE_DEPRESSION_RECOMMENDATION";
            case SEVERE:
                return "SEVERE_DEPRESSION_RECOMMENDATION";
            default:
                return "DEFAULT_RECOMMENDATION";
        }
    }
    
    public List<String> getAllCategories() {
        List<String> viCategories = questionViRepository.findDistinctCategories();
        List<String> enCategories = questionEnRepository.findDistinctCategories();
        
        // Merge and deduplicate categories
        List<String> allCategories = new java.util.ArrayList<>();
        allCategories.addAll(viCategories);
        allCategories.addAll(enCategories);
        
        return allCategories.stream().distinct().sorted().toList();
    }

    public List<DepressionTestResultDTO> getTestHistoryForUser(Long userId) {
        List<DepressionTestResult> results = testResultRepository.findByUserIdOrderByTestedAtDesc(userId);
        return results.stream().map(r -> {
            DepressionTestResultDTO dto = new DepressionTestResultDTO();
            dto.setId(r.getId());
            dto.setTotalScore(r.getTotalScore());
            dto.setSeverityLevel(r.getSeverityLevel() != null ? r.getSeverityLevel().name() : null);
            dto.setTestedAt(r.getTestedAt());
            dto.setDiagnosis(r.getDiagnosis());
            dto.setRecommendation(r.getRecommendation());
            dto.setStudentName(r.getUser() != null ? r.getUser().getFirstName() + " " + r.getUser().getLastName() : null);
            dto.setEmail(r.getUser() != null ? r.getUser().getEmail() : null);
            dto.setTestType(r.getTestType());
            return dto;
        }).toList();
    }
} 