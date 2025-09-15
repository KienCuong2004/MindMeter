package com.shop.backend.service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.util.*;

@SpringBootTest
@TestPropertySource(properties = {
    "OPENAI_API_KEY=test-key"
})
public class OpenAITestResultServiceTest {

    @Test
    public void testPersonalizedAnalysis() {
        // Tạo dữ liệu test mô phỏng
        Arrays.asList(
            createAnswer("Tôi cảm thấy buồn bã", "Cảm xúc", 3),
            createAnswer("Tôi có vấn đề về giấc ngủ", "Giấc ngủ", 2),
            createAnswer("Tôi mất hứng thú với các hoạt động", "Hứng thú", 4),
            createAnswer("Tôi cảm thấy mệt mỏi", "Năng lượng", 1)
        );

        Arrays.asList(
            createAnswer("Tôi cảm thấy buồn bã", "Cảm xúc", 1),
            createAnswer("Tôi có vấn đề về giấc ngủ", "Giấc ngủ", 4),
            createAnswer("Tôi mất hứng thú với các hoạt động", "Hứng thú", 1),
            createAnswer("Tôi cảm thấy mệt mỏi", "Năng lượng", 4)
        );

        // System.out.println("=== TEST CASE 1: Người có vấn đề về hứng thú ===");
        // System.out.println("Điểm: 10/16");
        // System.out.println("Pattern: Cao ở hứng thú, thấp ở năng lượng");
        // System.out.println("Kết quả mong đợi: Phân tích cụ thể về vấn đề hứng thú");
        
        // System.out.println("\n=== TEST CASE 2: Người có vấn đề về giấc ngủ ===");
        // System.out.println("Điểm: 10/16");
        // System.out.println("Pattern: Cao ở giấc ngủ và năng lượng, thấp ở cảm xúc và hứng thú");
        // System.out.println("Kết quả mong đợi: Phân tích cụ thể về vấn đề giấc ngủ");
    }

    private Map<String, Object> createAnswer(String questionText, String category, int answerValue) {
        Map<String, Object> answer = new HashMap<>();
        answer.put("questionText", questionText);
        answer.put("category", category);
        answer.put("answerValue", answerValue);
        answer.put("questionId", 1L);
        return answer;
    }
}
