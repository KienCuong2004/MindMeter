package com.shop.backend.service;

import com.shop.backend.model.Appointment;
import com.shop.backend.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationService {
    
    private final JavaMailSender mailSender;
    
    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;
    
    /**
     * Send general notification email
     */
    public void sendNotificationEmail(User user, String subject, String message, String type) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setTo(user.getEmail());
            helper.setSubject("[MindMeter] " + subject);
            
            String html = generateNotificationEmailHtml(user, subject, message, type);
            helper.setText(html, true);
            
            mailSender.send(mimeMessage);
            log.info("Notification email sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send notification email: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Send test result notification email
     */
    public void sendTestResultEmail(User user, String testType, String severity, String resultMessage) {
        String subject = "Kết quả test mới";
        String message = String.format(
            "Bạn đã hoàn thành bài test %s. Kết quả: %s. %s",
            testType,
            severity,
            resultMessage
        );
        sendNotificationEmail(user, subject, message, "TEST_RESULT");
    }
    
    /**
     * Send appointment reminder email
     */
    public void sendAppointmentReminderEmail(Appointment appointment, int hoursBefore) {
        User student = appointment.getStudent();
        User expert = appointment.getExpert();
        
        String expertName = expert.getFirstName() + " " + expert.getLastName();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy", Locale.forLanguageTag("vi-VN"));
        String appointmentTime = appointment.getAppointmentDate().format(formatter);
        
        String subject = hoursBefore == 24 
            ? "Nhắc nhở: Lịch hẹn của bạn vào ngày mai"
            : String.format("Nhắc nhở: Lịch hẹn của bạn sau %d giờ", hoursBefore);
        
        String message = String.format(
            "Bạn có lịch hẹn với chuyên gia %s vào %s. Vui lòng chuẩn bị sẵn sàng.",
            expertName,
            appointmentTime
        );
        
        sendNotificationEmail(student, subject, message, "APPOINTMENT_REMINDER");
    }
    
    /**
     * Generate notification email HTML
     */
    private String generateNotificationEmailHtml(User user, String subject, String message, String type) {
        String userName = user.getFirstName() != null ? user.getFirstName() : "Bạn";
        String icon = getIconForType(type);
        String color = getColorForType(type);
        
        return String.format("""
            <div style='max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);padding:32px;font-family:Segoe UI,Roboto,Arial,sans-serif;'>
              <div style='text-align:center;margin-bottom:32px;'>
                <div style='font-size:2rem;font-weight:700;color:#2563eb;letter-spacing:1px;margin-bottom:8px;'>MindMeter</div>
                <div style='font-size:1.1rem;color:#64748b;'>Thông báo</div>
              </div>
              
              <div style='margin-bottom:24px;'>
                <h2 style='color:#1e293b;margin:0 0 16px 0;font-size:1.5rem;'>Xin chào %s,</h2>
                <div style='background:%s;border-left:4px solid %s;border-radius:8px;padding:16px;margin:16px 0;'>
                  <div style='font-size:1.5rem;margin-bottom:8px;'>%s</div>
                  <h3 style='color:#1e293b;margin:0 0 12px 0;font-size:1.25rem;'>%s</h3>
                  <p style='margin:0;color:#475569;line-height:1.6;font-size:1rem;'>%s</p>
                </div>
              </div>
              
              <div style='text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;'>
                <a href='%s' style='display:inline-flex;align-items:center;gap:8px;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:500;font-size:1rem;'>
                  Xem chi tiết
                </a>
              </div>
              
              <div style='text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;'>
                <p style='margin:0;color:#94a3b8;font-size:0.875rem;line-height:1.5;'>
                  Trân trọng,<br>
                  <strong>Đội ngũ MindMeter</strong>
                </p>
              </div>
            </div>
            """, 
            userName, 
            getBackgroundColorForType(type),
            color,
            icon,
            subject,
            message.replace("\n", "<br>"),
            frontendUrl
        );
    }
    
    private String getIconForType(String type) {
        return switch (type) {
            case "TEST_RESULT" -> "📊";
            case "APPOINTMENT_REMINDER" -> "📅";
            case "APPOINTMENT" -> "📆";
            case "SEVERE_ALERT" -> "⚠️";
            default -> "📬";
        };
    }
    
    private String getColorForType(String type) {
        return switch (type) {
            case "TEST_RESULT" -> "#2563eb";
            case "APPOINTMENT_REMINDER" -> "#f59e0b";
            case "APPOINTMENT" -> "#10b981";
            case "SEVERE_ALERT" -> "#ef4444";
            default -> "#64748b";
        };
    }
    
    private String getBackgroundColorForType(String type) {
        return switch (type) {
            case "TEST_RESULT" -> "#eff6ff";
            case "APPOINTMENT_REMINDER" -> "#fffbeb";
            case "APPOINTMENT" -> "#f0fdf4";
            case "SEVERE_ALERT" -> "#fef2f2";
            default -> "#f8fafc";
        };
    }
}

