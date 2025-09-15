package com.shop.backend.controller;

import com.shop.backend.dto.FeedbackRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class FeedbackController {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${feedback.receiver}")
    private String feedbackReceiver;

    @PostMapping
    public String sendFeedback(@RequestBody FeedbackRequest request) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setTo(feedbackReceiver);
            helper.setSubject("Phản hồi mới từ MindMeter Chatbot");
            String email = request.getEmail() != null && !request.getEmail().isEmpty() ? request.getEmail() : "Không xác định";
            String html = String.format(
                "<div style='font-family:sans-serif;max-width:500px;margin:auto;border-radius:12px;border:1px solid #e0e7ff;background:#f8fafc;padding:24px;'>"
                + "<h2 style='color:#2563eb;margin-bottom:8px;'>Phản hồi mới từ MindMeter Chatbot</h2>"
                + "<div style='margin-bottom:12px;'><b>Email người gửi:</b> <span style='color:#0ea5e9;'>%s</span></div>"
                + "<div style='margin-bottom:12px;'><b>Nội dung phản hồi:</b></div>"
                + "<div style='background:#fff;border-radius:8px;padding:16px 12px;color:#334155;border:1px solid #e0e7ff;'>%s</div>"
                + "<div style='margin-top:24px;font-size:13px;color:#64748b;'>MindMeter Chatbot - <a href='https://mindmeter.vn' style='color:#6366f1;text-decoration:none;'>mindmeter.vn</a></div>"
                + "</div>",
                email,
                request.getFeedback() != null ? request.getFeedback().replace("\n", "<br>") : "(Không có nội dung)");
            helper.setText(html, true);
            mailSender.send(mimeMessage);
            return "{\"success\":true}";
        } catch (Exception e) {
            return "{\"success\":false,\"error\":\"" + e.getMessage() + "\"}";
        }
    }
} 