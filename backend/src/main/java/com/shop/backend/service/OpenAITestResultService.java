package com.shop.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class OpenAITestResultService {

    @Value("${OPENAI_API_KEY}")
    private String openaiApiKey;

    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Generate AI-powered test result analysis
     * @param testType The type of test (e.g., "DASS-21", "EPDS", "BDI")
     * @param totalScore The total score from the test
     * @param answers List of question-answer pairs for context
     * @return Map containing diagnosis, severity, and recommendation
     */
    public Map<String, String> generateTestResultAnalysis(String testType, Integer totalScore, List<Map<String, Object>> answers) {
        try {
            // Create the prompt for OpenAI
            String prompt = createAnalysisPrompt(testType, totalScore, answers);
            
            // Prepare the request
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-3.5-turbo");
            requestBody.put("messages", Arrays.asList(
                Map.of("role", "system", "content", getSystemPrompt()),
                Map.of("role", "user", "content", prompt)
            ));
            requestBody.put("max_tokens", 1000);
            requestBody.put("temperature", 0.7);

            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + openaiApiKey);

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

            // Call OpenAI API
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                OPENAI_API_URL, 
                HttpMethod.POST, 
                requestEntity, 
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null && responseBody.containsKey("choices")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> firstChoice = choices.get(0);
                    @SuppressWarnings("unchecked")
                    Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");
                    String content = (String) message.get("content");
                    
                    return parseAIResponse(content);
                }
            }
            
            // Fallback to default analysis if AI fails
            return getDefaultAnalysis(totalScore);
            
        } catch (Exception e) {
            System.err.println("Error calling OpenAI API: " + e.getMessage());
            // Return default analysis on error
            return getDefaultAnalysis(totalScore);
        }
    }

    private String getSystemPrompt() {
        return "Bạn là một chuyên gia tâm lý học chuyên nghiệp với nhiều năm kinh nghiệm trong việc đánh giá và chẩn đoán các vấn đề sức khỏe tâm thần. " +
               "Nhiệm vụ của bạn là phân tích kết quả các bài test tâm lý và đưa ra đánh giá chuyên môn, chẩn đoán và khuyến nghị phù hợp. " +
               "QUAN TRỌNG: Hãy tạo ra kết quả thực sự cá nhân hóa dựa trên từng câu trả lời cụ thể của người dùng. " +
               "Không sử dụng template chung, mà hãy phân tích pattern câu trả lời để đưa ra nhận xét riêng biệt. " +
               "Ví dụ: Nếu người dùng có điểm cao ở câu hỏi về giấc ngủ nhưng thấp ở câu hỏi về năng lượng, hãy đề cập cụ thể đến điều này. " +
               "Hãy trả lời bằng tiếng Việt và đảm bảo tính chuyên nghiệp, khách quan và hữu ích cho người dùng. " +
               "Lưu ý rằng đây chỉ là đánh giá sơ bộ, không thay thế cho chẩn đoán y tế chính thức.";
    }

    private String createAnalysisPrompt(String testType, Integer totalScore, List<Map<String, Object>> answers) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Bạn là một chuyên gia tâm lý học chuyên nghiệp. Hãy phân tích kết quả bài test ").append(testType).append(" của một người dùng.\n\n");
        
        prompt.append("THÔNG TIN BÀI TEST:\n");
        prompt.append("- Loại test: ").append(testType).append("\n");
        prompt.append("- Tổng điểm: ").append(totalScore).append("/").append(getMaxScore(testType)).append("\n");
        prompt.append("- Số câu hỏi: ").append(answers.size()).append("\n\n");
        
        prompt.append("CHI TIẾT CÂU TRẢ LỜI:\n");
        for (int i = 0; i < answers.size(); i++) {
            Map<String, Object> answer = answers.get(i);
            prompt.append("Câu ").append(i + 1).append(" (").append(answer.get("category")).append("): ").append(answer.get("questionText")).append("\n");
            prompt.append("Điểm: ").append(answer.get("answerValue")).append("/4\n");
            
            // Thêm phân tích ngắn gọn về từng câu trả lời
            int score = (Integer) answer.get("answerValue");
            if (score >= 3) {
                prompt.append("→ Dấu hiệu cao trong lĩnh vực ").append(answer.get("category")).append("\n");
            } else if (score >= 2) {
                prompt.append("→ Dấu hiệu trung bình trong lĩnh vực ").append(answer.get("category")).append("\n");
            } else {
                prompt.append("→ Dấu hiệu thấp trong lĩnh vực ").append(answer.get("category")).append("\n");
            }
            prompt.append("\n");
        }
        
        prompt.append("YÊU CẦU PHÂN TÍCH:\n");
        prompt.append("1. Phân tích từng câu trả lời để hiểu rõ tình trạng tâm lý cụ thể\n");
        prompt.append("2. Tạo chẩn đoán chi tiết, cá nhân hóa dựa trên pattern câu trả lời\n");
        prompt.append("3. Đưa ra khuyến nghị cụ thể, thực tế và hữu ích\n");
        prompt.append("4. Sử dụng ngôn ngữ thân thiện, dễ hiểu\n\n");
        
        prompt.append("ĐỊNH DẠNG TRẢ LỜI (JSON):\n");
        prompt.append("{\n");
        prompt.append("  \"diagnosis\": \"Chẩn đoán chi tiết, cá nhân hóa dựa trên pattern câu trả lời cụ thể\",\n");
        prompt.append("  \"severity\": \"Mức độ nghiêm trọng (MINIMAL/MILD/MODERATE/SEVERE)\",\n");
        prompt.append("  \"recommendation\": \"Khuyến nghị cụ thể, thực tế và hữu ích cho người dùng này\"\n");
        prompt.append("}\n\n");
        prompt.append("Lưu ý: Chỉ trả về JSON, không có text khác. Hãy tạo nội dung thực sự cá nhân hóa.");
        
        return prompt.toString();
    }
    
    private int getMaxScore(String testType) {
        // Tính điểm tối đa dựa trên loại test
        switch (testType.toUpperCase()) {
            case "DASS-21":
                return 63; // 21 câu x 3 điểm tối đa
            case "DASS-42":
                return 126; // 42 câu x 3 điểm tối đa
            case "EPDS":
                return 30; // 10 câu x 3 điểm tối đa
            case "BDI":
                return 63; // 21 câu x 3 điểm tối đa
            case "RADS":
                return 30; // 10 câu x 3 điểm tối đa
            default:
                return 40; // Mặc định
        }
    }

    private Map<String, String> parseAIResponse(String content) {
        try {
            // Try to extract JSON from the response
            int jsonStart = content.indexOf("{");
            int jsonEnd = content.lastIndexOf("}");
            
            if (jsonStart != -1 && jsonEnd != -1 && jsonEnd > jsonStart) {
                String jsonString = content.substring(jsonStart, jsonEnd + 1);
                @SuppressWarnings("unchecked")
                Map<String, Object> parsed = objectMapper.readValue(jsonString, Map.class);
                
                Map<String, String> result = new HashMap<>();
                result.put("diagnosis", (String) parsed.getOrDefault("diagnosis", "Không có dấu hiệu trầm cảm"));
                result.put("severity", (String) parsed.getOrDefault("severity", "MINIMAL"));
                result.put("recommendation", (String) parsed.getOrDefault("recommendation", "Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh."));
                
                return result;
            }
        } catch (Exception e) {
            System.err.println("Error parsing AI response: " + e.getMessage());
        }
        
        // Fallback if parsing fails
        return getDefaultAnalysis(0);
    }

    private Map<String, String> getDefaultAnalysis(Integer totalScore) {
        Map<String, String> result = new HashMap<>();
        
        if (totalScore <= 4) {
            result.put("diagnosis", "Không có dấu hiệu trầm cảm rõ ràng");
            result.put("severity", "MINIMAL");
            result.put("recommendation", "Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh, tập thể dục đều đặn và duy trì các mối quan hệ tích cực.");
        } else if (totalScore <= 9) {
            result.put("diagnosis", "Có một số dấu hiệu trầm cảm nhẹ cần chú ý");
            result.put("severity", "MILD");
            result.put("recommendation", "Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn như thiền, yoga, hoặc dành thời gian cho sở thích. Chia sẻ cảm xúc với người thân cũng rất hữu ích.");
        } else if (totalScore <= 14) {
            result.put("diagnosis", "Có dấu hiệu trầm cảm vừa cần can thiệp");
            result.put("severity", "MODERATE");
            result.put("recommendation", "Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý để được hỗ trợ chuyên môn. Đồng thời, hãy duy trì lối sống lành mạnh và tránh cô lập bản thân.");
        } else {
            result.put("diagnosis", "Có dấu hiệu trầm cảm nặng cần hỗ trợ ngay lập tức");
            result.put("severity", "SEVERE");
            result.put("recommendation", "Bạn có dấu hiệu trầm cảm nặng. Hãy liên hệ chuyên gia tâm lý hoặc bác sĩ ngay lập tức để được hỗ trợ chuyên môn. Đừng ngần ngại tìm kiếm sự giúp đỡ từ gia đình và bạn bè.");
        }
        
        return result;
    }
}
