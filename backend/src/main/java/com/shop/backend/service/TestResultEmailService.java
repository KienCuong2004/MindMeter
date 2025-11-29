package com.shop.backend.service;

import com.shop.backend.dto.depression.DepressionTestResponse;
import com.shop.backend.model.User;
import com.shop.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class TestResultEmailService {
    
    @Autowired
    private JavaMailSender mailSender;
    
    @Autowired
    private UserRepository userRepository;
    
    public void sendTestResultEmail(Long userId, DepressionTestResponse testResponse, String testType) {
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            String userName = user.getFirstName() != null && user.getLastName() != null 
                ? user.getFirstName() + " " + user.getLastName() 
                : user.getEmail();
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(user.getEmail());
            helper.setSubject("[MindMeter] Kết quả bài test " + testType + " của bạn");
            
            String html = generateTestResultEmail(userName, testResponse, testType);
            helper.setText(html, true);
            
            mailSender.send(message);
            
        } catch (Exception e) {
            // Don't throw to avoid affecting test submission
        }
    }
    
    private String generateTestResultEmail(String userName, DepressionTestResponse testResponse, String testType) {
        String severityText = getSeverityText(testResponse.getSeverityLevel());
        String severityColor = getSeverityColor(testResponse.getSeverityLevel());
        String recommendation = getRecommendationText(testResponse.getSeverityLevel());
        String contactExpert = testResponse.getShouldContactExpert() ? 
            "<div style='background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0;'>" +
                            "<h3 style='color:#dc2626;margin:0 0 8px 0;'>[WARNING] Khuyến nghị quan trọng</h3>" +
            "<p style='margin:0;color:#991b1b;'>Dựa trên kết quả test, chúng tôi khuyến nghị bạn nên tìm kiếm sự hỗ trợ chuyên môn từ chuyên gia tâm lý.</p>" +
            "</div>" : "";
        
        return String.format("""
            <div style='max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);padding:32px;font-family:Segoe UI,Roboto,Arial,sans-serif;'>
              <div style='text-align:center;margin-bottom:32px;'>
                <div style='font-size:2rem;font-weight:700;color:#2563eb;letter-spacing:1px;margin-bottom:8px;'>MindMeter</div>
                <div style='font-size:1.1rem;color:#64748b;'>Kết quả bài test tâm lý của bạn</div>
              </div>
              
              <div style='margin-bottom:24px;'>
                <h2 style='color:#1e293b;margin:0 0 16px 0;font-size:1.5rem;'>Xin chào %s,</h2>
                <p style='margin:0;line-height:1.6;color:#475569;font-size:1rem;'>
                  Cảm ơn bạn đã hoàn thành bài test <strong>%s</strong>. Dưới đây là kết quả chi tiết:
                </p>
              </div>
              
              <div style='background:#f8fafc;border-radius:12px;padding:24px;margin:24px 0;'>
                <h3 style='color:#1e293b;margin:0 0 16px 0;font-size:1.25rem;'>Kết quả test</h3>
                
                <div style='display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;'>
                  <div style='text-align:center;padding:16px;background:#fff;border-radius:8px;border:1px solid #e2e8f0;'>
                    <div style='font-size:0.875rem;color:#64748b;margin-bottom:4px;'>Điểm số</div>
                    <div style='font-size:1.5rem;font-weight:700;color:#1e293b;'>%d</div>
                  </div>
                  <div style='text-align:center;padding:16px;background:#fff;border-radius:8px;border:1px solid #e2e8f0;'>
                    <div style='font-size:0.875rem;color:#64748b;margin-bottom:4px;'>Mức độ</div>
                    <div style='font-size:1.25rem;font-weight:600;%s'>%s</div>
                  </div>
                </div>
                
                <div style='text-align:center;padding:16px;background:#fff;border-radius:8px;border:1px solid #e2e8f0;'>
                  <div style='font-size:0.875rem;color:#64748b;margin-bottom:4px;'>Thời gian test</div>
                  <div style='font-size:1rem;color:#1e293b;'>%s</div>
                </div>
              </div>
              
              <div style='background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin:16px 0;'>
                <h3 style='color:#0369a1;margin:0 0 8px 0;font-size:1.125rem;'>[INFO] Khuyến nghị</h3>
                <p style='margin:0;color:#0c4a6e;line-height:1.5;'>%s</p>
              </div>
              
              %s
              
              <div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;'>
                <h3 style='color:#166534;margin:0 0 8px 0;font-size:1.125rem;'>🔗 Hành động tiếp theo</h3>
                <ul style='margin:0;padding-left:20px;color:#166534;line-height:1.5;'>
                  <li>Xem chi tiết kết quả trong ứng dụng MindMeter</li>
                  <li>Lưu trữ kết quả để theo dõi tiến trình</li>
                  <li>Thực hiện test định kỳ để đánh giá sự thay đổi</li>
                  <li>Liên hệ chuyên gia nếu cần tư vấn thêm</li>
                </ul>
              </div>
              
              <div style='text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;'>
                <p style='margin:0 0 16px 0;color:#64748b;font-size:0.875rem;'>
                  Nếu có bất kỳ thắc mắc nào, hãy liên hệ với chúng tôi:
                </p>
                <div style='display:flex;justify-content:center;gap:16px;flex-wrap:wrap;'>
                  <a href='tel:0369702376' style='display:inline-flex;align-items:center;gap:8px;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:500;'>
                    0369 702 376
                  </a>
                  <a href='mailto:trankiencuong30072003@gmail.com' style='display:inline-flex;align-items:center;gap:8px;padding:12px 20px;background:#10b981;color:#fff;text-decoration:none;border-radius:8px;font-weight:500;'>
                    [EMAIL] Email hỗ trợ
                  </a>
                </div>
              </div>
              
              <div style='text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;'>
                <p style='margin:0;color:#94a3b8;font-size:0.875rem;line-height:1.5;'>
                  Trân trọng,<br>
                  <strong>Đội ngũ MindMeter</strong><br>
                  <span style='font-size:0.8rem;'>Hỗ trợ sức khỏe tâm thần 24/7</span>
                </p>
              </div>
            </div>
            """, 
            userName, 
            testType, 
            testResponse.getTotalScore(),
            severityColor,
            severityText,
            testResponse.getTestedAt().format(DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy", Locale.forLanguageTag("vi-VN"))),
            recommendation,
            contactExpert
        );
    }
    
    private String getSeverityText(String severityLevel) {
        switch (severityLevel) {
            case "MINIMAL": return "Bình thường";
            case "MILD": return "Trầm cảm nhẹ";
            case "MODERATE": return "Trầm cảm vừa";
            case "SEVERE": return "Trầm cảm nặng";
            default: return "Không xác định";
        }
    }
    
    private String getSeverityColor(String severityLevel) {
        switch (severityLevel) {
            case "MINIMAL": return "color:#059669;";
            case "MILD": return "color:#d97706;";
            case "MODERATE": return "color:#ea580c;";
            case "SEVERE": return "color:#dc2626;";
            default: return "color:#64748b;";
        }
    }
    
    private String getRecommendationText(String severityLevel) {
        switch (severityLevel) {
            case "MINIMAL":
                return "Tình trạng tâm lý của bạn hiện tại ổn định. Hãy duy trì lối sống lành mạnh và thực hiện test định kỳ để theo dõi.";
            case "MILD":
                return "Bạn có dấu hiệu trầm cảm nhẹ. Hãy chú ý đến sức khỏe tâm thần, thực hiện các hoạt động thư giãn và cân nhắc tìm kiếm sự hỗ trợ.";
            case "MODERATE":
                return "Bạn có dấu hiệu trầm cảm vừa. Chúng tôi khuyến nghị bạn nên tìm kiếm sự hỗ trợ từ chuyên gia tâm lý để được tư vấn phù hợp.";
            case "SEVERE":
                return "Bạn có dấu hiệu trầm cảm nặng. Điều này cần được quan tâm đặc biệt. Hãy liên hệ ngay với chuyên gia tâm lý để được hỗ trợ kịp thời.";
            default:
                return "Hãy tham khảo ý kiến chuyên gia để được đánh giá chính xác hơn về tình trạng của bạn.";
        }
    }
}
