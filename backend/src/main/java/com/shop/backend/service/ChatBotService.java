package com.shop.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClientException;
import java.util.Map;
import java.util.logging.Logger;
import java.util.HashMap;
import jakarta.annotation.PostConstruct;

@Service
public class ChatBotService {
    private static final Logger logger = Logger.getLogger(ChatBotService.class.getName());
    
    @Value("${OPENAI_API_KEY:}")
    private String openaiApiKey;

    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

    @PostConstruct
    public void init() {
        logger.info("ChatBotService initialized");
        
        // Force reload từ properties
        try {
            java.util.Properties props = new java.util.Properties();
            java.io.FileInputStream fis = new java.io.FileInputStream("src/main/resources/application.properties");
            props.load(fis);
            fis.close();
            
            String apiKeyFromFile = props.getProperty("OPENAI_API_KEY");
            logger.info("API Key from file: " + (apiKeyFromFile != null ? apiKeyFromFile.substring(0, Math.min(20, apiKeyFromFile.length())) + "..." : "NULL"));
            
            if (apiKeyFromFile != null && !apiKeyFromFile.trim().isEmpty()) {
                this.openaiApiKey = apiKeyFromFile.trim();
                logger.info("API Key reloaded from file");
            }
        } catch (Exception e) {
            logger.warning("Could not reload API key from file: " + e.getMessage());
        }
        
        logger.info("Final OpenAI API Key length: " + (openaiApiKey != null ? openaiApiKey.length() : "NULL"));
        if (openaiApiKey != null) {
            logger.info("Final OpenAI API Key starts with: " + openaiApiKey.substring(0, Math.min(20, openaiApiKey.length())));
        }
    }

    public String askOpenAI(String message) {
        try {
            // Debug: Log API key để kiểm tra
            logger.info("OpenAI API Key: " + (openaiApiKey != null ? openaiApiKey.substring(0, Math.min(20, openaiApiKey.length())) + "..." : "NULL"));
            
            if (openaiApiKey == null || openaiApiKey.trim().isEmpty()) {
                logger.severe("OpenAI API Key is null or empty!");
                return "Xin lỗi, có vấn đề với cấu hình AI service. Vui lòng liên hệ admin.";
            }
            
            RestTemplate restTemplate = new RestTemplate();

            // System prompt: tối ưu để AI chủ động gợi ý bài test, giải thích lý do, chuyên nghiệp, bảo mật
            // Nhận diện ngôn ngữ của user để trả lời phù hợp
            String userLanguage = detectLanguage(message);
            String systemPrompt;
            
            if (userLanguage.equals("vi")) {
                systemPrompt = "Bạn là MindMeter Chatbot, trợ lý AI chuyên nghiệp và thân thiện, hỗ trợ sức khoẻ tâm thần cho học sinh, sinh viên. MindMeter là nền tảng đánh giá sức khoẻ tâm thần hiện đại với các bài test sau:\n" +
                        "\n" +
                        "- DASS-21/DASS-42: Đánh giá mức độ trầm cảm, lo âu và stress tổng quát.\n" +
                        "- BDI: Đánh giá mức độ trầm cảm theo thang Beck.\n" +
                        "- RADS: Đánh giá trầm cảm ở thanh thiếu niên.\n" +
                        "- EPDS: Đánh giá trầm cảm sau sinh (phù hợp cho phụ nữ sau sinh).\n" +
                        "- SAS: Đánh giá mức độ lo âu.\n" +
                        "\n" +
                        "Ngoài ra, MindMeter còn cung cấp dịch vụ tư vấn với chuyên gia tâm lý thông qua hệ thống đặt lịch hẹn.\n" +
                        "\n" +
                        "Nhiệm vụ của bạn:\n" +
                        "- Chủ động lắng nghe, động viên, giải thích về các bài test, hướng dẫn sử dụng hệ thống, và khuyến khích người dùng chăm sóc sức khoẻ tâm thần.\n" +
                        "- Nếu phát hiện người dùng mô tả các dấu hiệu như: buồn bã, mất ngủ, mệt mỏi, lo lắng, tuyệt vọng, chán nản, không còn hứng thú, căng thẳng kéo dài, hãy chủ động gợi ý họ thực hiện bài test phù hợp:\n" +
                        "  + Nếu người dùng nói về lo âu, stress: Gợi ý DASS-21/DASS-42 hoặc SAS.\n" +
                        "  + Nếu người dùng nói về trầm cảm: Gợi ý DASS-21/DASS-42, BDI, hoặc RADS (nếu là thanh thiếu niên).\n" +
                        "  + Nếu người dùng là phụ nữ sau sinh: Gợi ý EPDS.\n" +
                        "- Khi gợi ý, hãy giải thích ngắn gọn lý do vì sao nên làm bài test, nhấn mạnh đây là công cụ tự đánh giá, không thay thế chẩn đoán y tế.\n" +
                        "- QUAN TRỌNG: Nếu người dùng đề cập đến việc cần tư vấn chuyên sâu, muốn nói chuyện với chuyên gia, hoặc có vấn đề phức tạp, hãy gợi ý họ sử dụng dịch vụ đặt lịch hẹn với chuyên gia tâm lý.\n" +
                        "- Khi gợi ý đặt lịch hẹn, hãy giải thích rằng chuyên gia sẽ lắng nghe, tư vấn và hỗ trợ họ một cách chuyên nghiệp.\n" +
                        "- Nếu người dùng hỏi về sức khoẻ tâm thần, hãy trả lời dựa trên kiến thức khoa học, trung lập, không phán xét.\n" +
                        "- Tuyệt đối không chẩn đoán, không tư vấn y tế, không trả lời các chủ đề nhạy cảm (tự tử, bạo lực, lạm dụng, v.v.), không thu thập hay tiết lộ thông tin cá nhân.\n" +
                        "- Nếu người dùng đề cập đến chủ đề nhạy cảm, bảo mật, hoặc cần hỗ trợ chuyên sâu, hãy khuyên họ liên hệ chuyên gia tâm lý hoặc bác sĩ.\n" +
                        "- Luôn trả lời thân thiện, tích cực, bảo mật, chuyên nghiệp và hỗ trợ đúng vai trò.\n" +
                        "- Khi gợi ý đặt lịch hẹn, hãy thêm từ khóa 'APPOINTMENT_SUGGESTION' vào cuối câu trả lời để hệ thống nhận diện.\n" +
                        "- QUAN TRỌNG: Nếu người dùng muốn đặt lịch trực tiếp, hãy trả lời với format: 'AUTO_BOOK:expert_name|date|time|duration' để hệ thống tự động đặt lịch.\n" +
                        "- QUAN TRỌNG: Khi user nói về ngày thứ trong tuần (thứ 2, thứ 3, thứ 4, thứ 5, thứ 6, thứ 7, chủ nhật), hãy chuyển thành ngày cụ thể trong tuần tới (dd/MM/yyyy). Ví dụ: 'thứ 2' = ngày thứ 2 tuần tới, 'thứ 3' = ngày thứ 3 tuần tới.\n" +
                        "- QUAN TRỌNG: Khi user nói 'hôm nay', 'ngày mai', 'ngày kia', 'tuần này', 'tuần tới', hãy chuyển thành ngày cụ thể (dd/MM/yyyy).\n" +
                        "- QUAN TRỌNG: Khi user nói 'ngày mai', hãy tính ngày cụ thể của ngày mai dựa trên ngày hôm nay. Ví dụ: hôm nay là 18/08/2025 thì 'ngày mai' = 19/08/2025.\n" +
                        "- QUAN TRỌNG: LUÔN LUÔN sử dụng năm hiện tại (2025) khi tính ngày mai, ngày kia, thứ trong tuần.\n" +
                        "- QUAN TRỌNG: Khi user nói giờ ngắn gọn như '12h', '14h', '16h', '9h sáng', '2h chiều', '8h tối', hãy chuyển thành format chuẩn HH:mm.\n" +
                        "- QUAN TRỌNG: Nếu user đã cung cấp đủ thông tin để đặt lịch tự động (tên chuyên gia, ngày, giờ), hãy TRỰC TIẾP trả lời với format AUTO_BOOK mà KHÔNG cần hỏi thêm thông tin.\n" +
                        "- QUAN TRỌNG: Chỉ hỏi thêm thông tin khi user thiếu thông tin cần thiết.\n" +
                        "- QUAN TRỌNG: LUÔN LUÔN trả lời bằng tiếng Việt khi user dùng tiếng Việt. Không bao giờ trả lời bằng tiếng Anh.\n" +
                        "- QUAN TRỌNG: Ví dụ cụ thể về format AUTO_BOOK:\n" +
                        "  + User: 'Tôi muốn đặt lịch với chuyên gia Trần Kiên Cường vào 16 giờ ngày mai với thời lượng 30 phút'\n" +
                        "  + AI trả lời: 'AUTO_BOOK:Trần Kiên Cường|ngày mai|16:00|30'\n" +
                        "  + User: 'Đặt lịch với chuyên gia tâm lý vào 9h sáng thứ 2'\n" +
                        "  + AI trả lời: 'AUTO_BOOK:chuyên gia tâm lý|thứ 2|09:00|60'\n" +
                        "- QUAN TRỌNG: KHÔNG BAO GIỜ trả về ngày cứng (dd/MM/yyyy) trong AUTO_BOOK. Luôn sử dụng từ ngữ tự nhiên như 'ngày mai', 'thứ 2', 'hôm nay' để hệ thống tự động parse.";
            } else {
                systemPrompt = "You are MindMeter Chatbot, a professional and friendly AI assistant supporting mental health for students and university students. MindMeter is a modern mental health assessment platform with the following tests:\n" +
                        "\n" +
                        "- DASS-21/DASS-42: Comprehensive assessment of depression, anxiety, and stress levels.\n" +
                        "- BDI: Depression assessment using Beck scale.\n" +
                        "- RADS: Depression assessment for adolescents.\n" +
                        "- EPDS: Postpartum depression assessment.\n" +
                        "- SAS: Anxiety level assessment.\n" +
                        "\n" +
                        "Additionally, MindMeter provides consultation services with psychological experts through the appointment booking system.\n" +
                        "\n" +
                        "Your tasks:\n" +
                        "- Actively listen, encourage, explain about tests, guide system usage, and encourage users to care for their mental health.\n" +
                        "- If you detect users describing symptoms like: sadness, insomnia, fatigue, anxiety, hopelessness, loss of interest, prolonged stress, proactively suggest appropriate tests:\n" +
                        "  + If users mention anxiety, stress: Suggest DASS-21/DASS-42 or SAS.\n" +
                        "  + If users mention depression: Suggest DASS-21/DASS-42, BDI, or RADS (if adolescents).\n" +
                        "  + If users are postpartum women: Suggest EPDS.\n" +
                        "- When suggesting, briefly explain why they should take the test, emphasizing this is a self-assessment tool, not a medical diagnosis.\n" +
                        "- IMPORTANT: If users mention needing in-depth consultation, wanting to talk to experts, or having complex issues, suggest they use the appointment booking service with psychological experts.\n" +
                        "- When suggesting appointments, explain that experts will listen, consult, and support them professionally.\n" +
                        "- If users ask about mental health, answer based on scientific knowledge, neutrally, without judgment.\n" +
                        "- Absolutely no diagnosis, no medical advice, no sensitive topics (suicide, violence, abuse, etc.), no collection or disclosure of personal information.\n" +
                        "- If users mention sensitive topics, confidentiality, or need in-depth support, advise them to contact psychological experts or doctors.\n" +
                        "- Always respond friendly, positively, confidentially, professionally, and support the right role.\n" +
                        "- When suggesting appointments, add keyword 'APPOINTMENT_SUGGESTION' at the end of the response for system recognition.\n" +
                        "- IMPORTANT: If users want to book directly, respond with format: 'AUTO_BOOK:expert_name|date|time|duration' for automatic booking.\n" +
                        "- IMPORTANT: When users mention weekdays (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday), convert to specific dates next week (dd/MM/yyyy). Example: 'Monday' = next Monday's date, 'Tuesday' = next Tuesday's date.\n" +
                        "- IMPORTANT: When users say 'today', 'tomorrow', 'day after tomorrow', 'this week', 'next week', convert to specific dates (dd/MM/yyyy).\n" +
                        "- IMPORTANT: When users say time in short form like '12h', '14h', '16h', '9am', '2pm', '8pm', convert to standard HH:mm format.\n" +
                        "- IMPORTANT: If users provide enough information for automatic booking (expert name, date, time), respond DIRECTLY with AUTO_BOOK format WITHOUT asking for additional information.\n" +
                        "- IMPORTANT: Only ask for additional information when users lack necessary details.\n" +
                        "- IMPORTANT: ALWAYS respond in English when users use English. Never respond in Vietnamese.\n" +
                        "- IMPORTANT: Specific examples of AUTO_BOOK format:\n" +
                        "  + User: 'I want to book an appointment with expert Tran Kien Cuong at 4 PM tomorrow for 30 minutes'\n" +
                        "  + AI response: 'AUTO_BOOK:Tran Kien Cuong|tomorrow|16:00|30'\n" +
                        "  + User: 'Book appointment with psychologist at 9 AM Monday'\n" +
                        "  + AI response: 'AUTO_BOOK:psychologist|Monday|09:00|60'\n" +
                        "- IMPORTANT: NEVER return hardcoded dates (dd/MM/yyyy) in AUTO_BOOK. Always use natural language like 'tomorrow', 'Monday', 'today' for the system to automatically parse.";
            }

            Map<String, Object> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", systemPrompt);

            Map<String, Object> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", message);

            Object[] messages = new Object[] { systemMessage, userMessage };

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-3.5-turbo");
            requestBody.put("messages", messages);

            // Tạo headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + openaiApiKey);
            headers.set("Accept-Charset", "UTF-8");

            // Tạo request entity
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

            // Gọi API
            logger.info("Calling OpenAI API with URL: " + OPENAI_API_URL);
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(OPENAI_API_URL, requestEntity, Map.class);
            logger.info("OpenAI API Response Status: " + response.getStatusCode());

            @SuppressWarnings("rawtypes")
            Map responseBody = response.getBody();
            if (responseBody != null && responseBody.containsKey("choices")) {
                Object choicesObj = responseBody.get("choices");
                if (choicesObj instanceof java.util.List) {
                    java.util.List<?> choices = (java.util.List<?>) choicesObj;
                    if (!choices.isEmpty()) {
                        Object firstObj = choices.get(0);
                        if (firstObj instanceof Map) {
                            Map<?, ?> first = (Map<?, ?>) firstObj;
                            Object messageObj = first.get("message");
                            if (messageObj instanceof Map) {
                                Map<?, ?> messageMap = (Map<?, ?>) messageObj;
                                if (messageMap.containsKey("content")) {
                                    String aiResponse = messageMap.get("content").toString();
                                    logger.info("AI Response: " + aiResponse);
                                    
                                    // Kiểm tra xem AI có trả về format AUTO_BOOK không
                                    if (aiResponse.contains("AUTO_BOOK:")) {
                                        logger.info("[SUCCESS] AI đã trả về format AUTO_BOOK đúng!");
                                    } else {
                                        logger.info("[ERROR] AI KHÔNG trả về format AUTO_BOOK");
                                    }
                                    
                                    return aiResponse;
                                }
                            }
                        }
                    }
                }
            }
            return "Xin lỗi, tôi không thể trả lời lúc này.";
            
        } catch (RestClientException e) {
            logger.warning("RestClientException when calling OpenAI API: " + e.getMessage());
            logger.warning("Exception details: " + e.toString());
            
            if (e.getMessage().contains("401")) {
                return "Xin lỗi, có vấn đề với cấu hình AI service (401 Unauthorized). Vui lòng liên hệ admin.";
            } else if (e.getMessage().contains("Failed to resolve") || e.getMessage().contains("DNS")) {
                return "Xin lỗi, hiện tại không thể kết nối đến AI service. Vui lòng thử lại sau hoặc liên hệ admin để được hỗ trợ.";
            }
            return "Xin lỗi, có lỗi kết nối. Vui lòng thử lại sau.";
            
        } catch (Exception e) {
            logger.severe("Unexpected error in ChatBot service: " + e.getMessage());
            return "Xin lỗi, có lỗi không mong muốn xảy ra. Vui lòng thử lại sau.";
        }
    }
    
    /**
     * Nhận diện ngôn ngữ của user dựa trên tin nhắn
     * @param message tin nhắn của user
     * @return "vi" nếu tiếng Việt, "en" nếu tiếng Anh
     */
    private String detectLanguage(String message) {
        if (message == null || message.trim().isEmpty()) {
            return "en"; // Default to English
        }
        
        String lowerMessage = message.toLowerCase();
        
        // Các từ khóa tiếng Việt phổ biến
        String[] vietnameseKeywords = {
            "tôi", "bạn", "có", "không", "là", "đang", "sẽ", "đã", "và", "hoặc",
            "thứ", "ngày", "giờ", "phút", "giây", "tuần", "tháng", "năm",
            "hôm nay", "ngày mai", "ngày kia", "hôm qua", "tuần này", "tuần tới",
            "chuyên gia", "tâm lý", "trầm cảm", "lo âu", "stress", "căng thẳng",
            "buồn", "mệt mỏi", "mất ngủ", "tuyệt vọng", "chán nản",
            "đặt lịch", "tư vấn", "hẹn", "khám", "điều trị",
            "sáng", "chiều", "tối", "trưa", "đêm"
        };
        
        // Các từ khóa tiếng Anh phổ biến
        String[] englishKeywords = {
            "i", "you", "he", "she", "it", "we", "they", "am", "is", "are",
            "was", "were", "have", "has", "had", "will", "would", "could",
            "today", "tomorrow", "yesterday", "this week", "next week",
            "expert", "psychologist", "depression", "anxiety", "stress",
            "sad", "tired", "insomnia", "hopeless", "depressed",
            "book", "appointment", "consultation", "meeting", "treatment"
        };
        
        int vietnameseCount = 0;
        int englishCount = 0;
        
        // Đếm từ khóa tiếng Việt
        for (String keyword : vietnameseKeywords) {
            if (lowerMessage.contains(keyword)) {
                vietnameseCount++;
            }
        }
        
        // Đếm từ khóa tiếng Anh
        for (String keyword : englishKeywords) {
            if (lowerMessage.contains(keyword)) {
                englishCount++;
            }
        }
        
        // Nếu có nhiều từ khóa tiếng Việt hơn, trả về tiếng Việt
        if (vietnameseCount > englishCount) {
            return "vi";
        } else if (englishCount > vietnameseCount) {
            return "en";
        } else {
            // Nếu bằng nhau, kiểm tra ký tự đặc biệt tiếng Việt
            if (lowerMessage.contains("à") || lowerMessage.contains("á") || 
                lowerMessage.contains("ạ") || lowerMessage.contains("ả") ||
                lowerMessage.contains("ã") || lowerMessage.contains("ă") ||
                lowerMessage.contains("ằ") || lowerMessage.contains("ắ") ||
                lowerMessage.contains("ặ") || lowerMessage.contains("ẳ") ||
                lowerMessage.contains("ẵ") || lowerMessage.contains("â") ||
                lowerMessage.contains("ầ") || lowerMessage.contains("ấ") ||
                lowerMessage.contains("ậ") || lowerMessage.contains("ẩ") ||
                lowerMessage.contains("ẫ") || lowerMessage.contains("è") ||
                lowerMessage.contains("é") || lowerMessage.contains("ẹ") ||
                lowerMessage.contains("ẻ") || lowerMessage.contains("ẽ") ||
                lowerMessage.contains("ê") || lowerMessage.contains("ề") ||
                lowerMessage.contains("ế") || lowerMessage.contains("ệ") ||
                lowerMessage.contains("ể") || lowerMessage.contains("ễ") ||
                lowerMessage.contains("ì") || lowerMessage.contains("í") ||
                lowerMessage.contains("ị") || lowerMessage.contains("ỉ") ||
                lowerMessage.contains("ĩ") || lowerMessage.contains("ò") ||
                lowerMessage.contains("ó") || lowerMessage.contains("ọ") ||
                lowerMessage.contains("ỏ") || lowerMessage.contains("õ") ||
                lowerMessage.contains("ô") || lowerMessage.contains("ồ") ||
                lowerMessage.contains("ố") || lowerMessage.contains("ộ") ||
                lowerMessage.contains("ổ") || lowerMessage.contains("ỗ") ||
                lowerMessage.contains("ơ") || lowerMessage.contains("ờ") ||
                lowerMessage.contains("ớ") || lowerMessage.contains("ợ") ||
                lowerMessage.contains("ở") || lowerMessage.contains("ỡ") ||
                lowerMessage.contains("ù") || lowerMessage.contains("ú") ||
                lowerMessage.contains("ụ") || lowerMessage.contains("ủ") ||
                lowerMessage.contains("ũ") || lowerMessage.contains("ư") ||
                lowerMessage.contains("ừ") || lowerMessage.contains("ứ") ||
                lowerMessage.contains("ự") || lowerMessage.contains("ử") ||
                lowerMessage.contains("ữ") || lowerMessage.contains("ỳ") ||
                lowerMessage.contains("ý") || lowerMessage.contains("ỵ") ||
                lowerMessage.contains("ỷ") || lowerMessage.contains("ỹ")) {
                return "vi";
            }
            
            // Default to English
            return "en";
        }
    }
} 