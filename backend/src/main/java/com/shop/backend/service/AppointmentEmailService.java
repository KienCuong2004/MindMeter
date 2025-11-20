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
public class AppointmentEmailService {
    
    private final JavaMailSender mailSender;
    
    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;
    
    /**
     * Gửi email xác nhận đặt lịch cho học sinh
     */
    public void sendBookingConfirmationToStudent(Appointment appointment) {
        try {
            User student = appointment.getStudent();
            User expert = appointment.getExpert();
            
            String studentName = getFullName(student);
            String expertName = getFullName(expert);
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(student.getEmail());
            helper.setSubject("[MindMeter] Xác nhận đặt lịch hẹn với chuyên gia");
            
            String html = generateBookingConfirmationEmailForStudent(
                studentName, 
                expertName, 
                appointment
            );
            helper.setText(html, true);
            
            mailSender.send(message);
            log.info("Đã gửi email xác nhận đặt lịch cho học sinh: {}", student.getEmail());
            
        } catch (Exception e) {
            log.error("Lỗi khi gửi email xác nhận đặt lịch cho học sinh: {}", e.getMessage(), e);
            // Không throw exception để không ảnh hưởng đến flow chính
        }
    }
    
    /**
     * Gửi email thông báo đặt lịch cho chuyên gia
     */
    public void sendBookingNotificationToExpert(Appointment appointment) {
        try {
            User student = appointment.getStudent();
            User expert = appointment.getExpert();
            
            String studentName = getFullName(student);
            String expertName = getFullName(expert);
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(expert.getEmail());
            helper.setSubject("[MindMeter] Thông báo: Có lịch hẹn mới cần xác nhận");
            
            String html = generateBookingNotificationEmailForExpert(
                expertName, 
                studentName, 
                appointment,
                frontendUrl
            );
            helper.setText(html, true);
            
            mailSender.send(message);
            log.info("Đã gửi email thông báo đặt lịch cho chuyên gia: {}", expert.getEmail());
            
        } catch (Exception e) {
            log.error("Lỗi khi gửi email thông báo đặt lịch cho chuyên gia: {}", e.getMessage(), e);
            // Không throw exception để không ảnh hưởng đến flow chính
        }
    }
    
    /**
     * Gửi email xác nhận lịch hẹn đã được chuyên gia xác nhận cho học sinh
     */
    public void sendConfirmationToStudent(Appointment appointment) {
        try {
            User student = appointment.getStudent();
            User expert = appointment.getExpert();
            
            String studentName = getFullName(student);
            String expertName = getFullName(expert);
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(student.getEmail());
            helper.setSubject("[MindMeter] Lịch hẹn của bạn đã được xác nhận");
            
            String html = generateConfirmationEmailForStudent(
                studentName, 
                expertName, 
                appointment
            );
            helper.setText(html, true);
            
            mailSender.send(message);
            log.info("Đã gửi email xác nhận lịch hẹn cho học sinh: {}", student.getEmail());
            
        } catch (Exception e) {
            log.error("Lỗi khi gửi email xác nhận lịch hẹn cho học sinh: {}", e.getMessage(), e);
            // Không throw exception để không ảnh hưởng đến flow chính
        }
    }
    
    /**
     * Gửi email xác nhận lịch hẹn đã được chuyên gia xác nhận cho chuyên gia
     */
    public void sendConfirmationToExpert(Appointment appointment) {
        try {
            User student = appointment.getStudent();
            User expert = appointment.getExpert();
            
            String studentName = getFullName(student);
            String expertName = getFullName(expert);
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(expert.getEmail());
            helper.setSubject("[MindMeter] Xác nhận: Lịch hẹn đã được xác nhận thành công");
            
            String html = generateConfirmationEmailForExpert(
                expertName, 
                studentName, 
                appointment,
                frontendUrl
            );
            helper.setText(html, true);
            
            mailSender.send(message);
            log.info("Đã gửi email xác nhận lịch hẹn cho chuyên gia: {}", expert.getEmail());
            
        } catch (Exception e) {
            log.error("Lỗi khi gửi email xác nhận lịch hẹn cho chuyên gia: {}", e.getMessage(), e);
            // Không throw exception để không ảnh hưởng đến flow chính
        }
    }
    
    /**
     * Helper method để lấy tên đầy đủ
     */
    private String getFullName(User user) {
        if (user.getFirstName() != null && user.getLastName() != null) {
            return user.getFirstName() + " " + user.getLastName();
        } else if (user.getFirstName() != null) {
            return user.getFirstName();
        } else {
            return user.getEmail();
        }
    }
    
    /**
     * Helper method để format ngày giờ
     */
    private String formatDateTime(Appointment appointment) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy", Locale.forLanguageTag("vi-VN"));
        return appointment.getAppointmentDate().format(formatter);
    }
    
    /**
     * Helper method để lấy text cho consultation type
     */
    private String getConsultationTypeText(Appointment.ConsultationType type) {
        switch (type) {
            case ONLINE:
                return "Trực tuyến (Online)";
            case PHONE:
                return "Điện thoại";
            case IN_PERSON:
                return "Trực tiếp (In-person)";
            default:
                return "Trực tuyến";
        }
    }
    
    /**
     * Generate HTML email template cho học sinh khi đặt lịch
     */
    private String generateBookingConfirmationEmailForStudent(String studentName, String expertName, Appointment appointment) {
        String appointmentDateTime = formatDateTime(appointment);
        String consultationType = getConsultationTypeText(appointment.getConsultationType());
        String duration = appointment.getDurationMinutes() + " phút";
        String notes = appointment.getNotes() != null && !appointment.getNotes().trim().isEmpty() 
            ? "<p style='margin:8px 0;color:#475569;'><strong>Ghi chú:</strong> " + escapeHtml(appointment.getNotes()) + "</p>"
            : "";
        String meetingInfo = "";
        
        if (appointment.getConsultationType() == Appointment.ConsultationType.ONLINE && appointment.getMeetingLink() != null) {
            meetingInfo = "<p style='margin:8px 0;color:#475569;'><strong>Link meeting:</strong> <a href='" + appointment.getMeetingLink() + "' style='color:#2563eb;'>" + appointment.getMeetingLink() + "</a></p>";
        } else if (appointment.getConsultationType() == Appointment.ConsultationType.IN_PERSON && appointment.getMeetingLocation() != null) {
            meetingInfo = "<p style='margin:8px 0;color:#475569;'><strong>Địa điểm:</strong> " + escapeHtml(appointment.getMeetingLocation()) + "</p>";
        }
        
        return String.format("""
            <div style='max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);padding:32px;font-family:Segoe UI,Roboto,Arial,sans-serif;'>
              <div style='text-align:center;margin-bottom:32px;'>
                <div style='font-size:2rem;font-weight:700;color:#2563eb;letter-spacing:1px;margin-bottom:8px;'>MindMeter</div>
                <div style='font-size:1.1rem;color:#64748b;'>Xác nhận đặt lịch hẹn</div>
              </div>
              
              <div style='margin-bottom:24px;'>
                <h2 style='color:#1e293b;margin:0 0 16px 0;font-size:1.5rem;'>Xin chào %s,</h2>
                <p style='margin:0;line-height:1.6;color:#475569;font-size:1rem;'>
                  Cảm ơn bạn đã đặt lịch hẹn với chuyên gia <strong>%s</strong>. Lịch hẹn của bạn đã được ghi nhận và đang chờ chuyên gia xác nhận.
                </p>
              </div>
              
              <div style='background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:24px;margin:24px 0;'>
                <h3 style='color:#0369a1;margin:0 0 16px 0;font-size:1.25rem;'>📅 Thông tin lịch hẹn</h3>
                
                <div style='background:#fff;border-radius:8px;padding:16px;margin-bottom:12px;'>
                  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;'>
                    <span style='color:#64748b;font-size:0.875rem;'>Chuyên gia:</span>
                    <span style='color:#1e293b;font-weight:600;'>%s</span>
                  </div>
                  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;'>
                    <span style='color:#64748b;font-size:0.875rem;'>Thời gian:</span>
                    <span style='color:#1e293b;font-weight:600;'>%s</span>
                  </div>
                  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;'>
                    <span style='color:#64748b;font-size:0.875rem;'>Thời lượng:</span>
                    <span style='color:#1e293b;font-weight:600;'>%s</span>
                  </div>
                  <div style='display:flex;justify-content:space-between;align-items:center;'>
                    <span style='color:#64748b;font-size:0.875rem;'>Hình thức:</span>
                    <span style='color:#1e293b;font-weight:600;'>%s</span>
                  </div>
                </div>
                
                %s
                %s
              </div>
              
              <div style='background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:16px 0;'>
                <h3 style='color:#92400e;margin:0 0 8px 0;font-size:1.125rem;'>⏳ Trạng thái: Đang chờ xác nhận</h3>
                <p style='margin:0;color:#78350f;line-height:1.5;'>
                  Lịch hẹn của bạn đang ở trạng thái <strong>PENDING</strong>. Chuyên gia sẽ xem xét và xác nhận trong thời gian sớm nhất. 
                  Bạn sẽ nhận được email thông báo khi lịch hẹn được xác nhận.
                </p>
              </div>
              
              <div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;'>
                <h3 style='color:#166534;margin:0 0 8px 0;font-size:1.125rem;'>📌 Lưu ý</h3>
                <ul style='margin:0;padding-left:20px;color:#166534;line-height:1.5;'>
                  <li>Vui lòng kiểm tra email thường xuyên để nhận thông báo xác nhận</li>
                  <li>Nếu có thay đổi, vui lòng liên hệ với chuyên gia hoặc hủy lịch hẹn trước 24 giờ</li>
                  <li>Đảm bảo bạn có mặt đúng giờ để buổi tư vấn diễn ra suôn sẻ</li>
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
                    Email hỗ trợ
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
            studentName, expertName, expertName, appointmentDateTime, duration, consultationType, notes, meetingInfo
        );
    }
    
    /**
     * Generate HTML email template cho chuyên gia khi có lịch hẹn mới
     */
    private String generateBookingNotificationEmailForExpert(String expertName, String studentName, Appointment appointment, String frontendUrl) {
        String appointmentDateTime = formatDateTime(appointment);
        String consultationType = getConsultationTypeText(appointment.getConsultationType());
        String duration = appointment.getDurationMinutes() + " phút";
        String notes = appointment.getNotes() != null && !appointment.getNotes().trim().isEmpty() 
            ? "<p style='margin:8px 0;color:#475569;'><strong>Ghi chú từ học sinh:</strong> " + escapeHtml(appointment.getNotes()) + "</p>"
            : "";
        
        return String.format("""
            <div style='max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);padding:32px;font-family:Segoe UI,Roboto,Arial,sans-serif;'>
              <div style='text-align:center;margin-bottom:32px;'>
                <div style='font-size:2rem;font-weight:700;color:#2563eb;letter-spacing:1px;margin-bottom:8px;'>MindMeter</div>
                <div style='font-size:1.1rem;color:#64748b;'>Thông báo lịch hẹn mới</div>
              </div>
              
              <div style='margin-bottom:24px;'>
                <h2 style='color:#1e293b;margin:0 0 16px 0;font-size:1.5rem;'>Xin chào %s,</h2>
                <p style='margin:0;line-height:1.6;color:#475569;font-size:1rem;'>
                  Bạn có một lịch hẹn mới từ học sinh <strong>%s</strong> cần xác nhận.
                </p>
              </div>
              
              <div style='background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:24px;margin:24px 0;'>
                <h3 style='color:#dc2626;margin:0 0 16px 0;font-size:1.25rem;'>🔔 Lịch hẹn mới cần xác nhận</h3>
                
                <div style='background:#fff;border-radius:8px;padding:16px;margin-bottom:12px;'>
                  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;'>
                    <span style='color:#64748b;font-size:0.875rem;'>Học sinh:</span>
                    <span style='color:#1e293b;font-weight:600;'>%s</span>
                  </div>
                  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;'>
                    <span style='color:#64748b;font-size:0.875rem;'>Email:</span>
                    <span style='color:#1e293b;font-weight:600;'>%s</span>
                  </div>
                  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;'>
                    <span style='color:#64748b;font-size:0.875rem;'>Thời gian:</span>
                    <span style='color:#1e293b;font-weight:600;'>%s</span>
                  </div>
                  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;'>
                    <span style='color:#64748b;font-size:0.875rem;'>Thời lượng:</span>
                    <span style='color:#1e293b;font-weight:600;'>%s</span>
                  </div>
                  <div style='display:flex;justify-content:space-between;align-items:center;'>
                    <span style='color:#64748b;font-size:0.875rem;'>Hình thức:</span>
                    <span style='color:#1e293b;font-weight:600;'>%s</span>
                  </div>
                </div>
                
                %s
              </div>
              
              <div style='background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:16px 0;'>
                <h3 style='color:#92400e;margin:0 0 8px 0;font-size:1.125rem;'>⏳ Hành động cần thực hiện</h3>
                <p style='margin:0;color:#78350f;line-height:1.5;'>
                  Vui lòng đăng nhập vào hệ thống MindMeter để xem chi tiết và xác nhận lịch hẹn này. 
                  Học sinh/ sinh viên đang chờ phản hồi từ bạn.
                </p>
              </div>
              
              <div style='text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;'>
                <a href='%s/expert/appointments' style='display:inline-flex;align-items:center;gap:8px;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:500;font-size:1rem;'>
                  Xem lịch hẹn trong Dashboard
                </a>
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
            expertName, studentName, studentName, appointment.getStudent().getEmail(), 
            appointmentDateTime, duration, consultationType, notes, frontendUrl
        );
    }
    
    /**
     * Generate HTML email template cho học sinh khi lịch hẹn được xác nhận
     */
    private String generateConfirmationEmailForStudent(String studentName, String expertName, Appointment appointment) {
        String appointmentDateTime = formatDateTime(appointment);
        String consultationType = getConsultationTypeText(appointment.getConsultationType());
        String duration = appointment.getDurationMinutes() + " phút";
        String notes = appointment.getNotes() != null && !appointment.getNotes().trim().isEmpty() 
            ? "<p style='margin:8px 0;color:#475569;'><strong>Ghi chú:</strong> " + escapeHtml(appointment.getNotes()) + "</p>"
            : "";
        String expertNotes = appointment.getExpertNotes() != null && !appointment.getExpertNotes().trim().isEmpty() 
            ? "<div style='background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px;margin:12px 0;'><p style='margin:0;color:#0369a1;'><strong>Ghi chú từ chuyên gia:</strong> " + escapeHtml(appointment.getExpertNotes()) + "</p></div>"
            : "";
        String meetingInfo = "";
        
        if (appointment.getConsultationType() == Appointment.ConsultationType.ONLINE && appointment.getMeetingLink() != null) {
            meetingInfo = "<p style='margin:8px 0;color:#475569;'><strong>Link meeting:</strong> <a href='" + appointment.getMeetingLink() + "' style='color:#2563eb;'>" + appointment.getMeetingLink() + "</a></p>";
        } else if (appointment.getConsultationType() == Appointment.ConsultationType.IN_PERSON && appointment.getMeetingLocation() != null) {
            meetingInfo = "<p style='margin:8px 0;color:#475569;'><strong>Địa điểm:</strong> " + escapeHtml(appointment.getMeetingLocation()) + "</p>";
        }
        
        return String.format("""
            <div style='max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);padding:32px;font-family:Segoe UI,Roboto,Arial,sans-serif;'>
              <div style='text-align:center;margin-bottom:32px;'>
                <div style='font-size:2rem;font-weight:700;color:#2563eb;letter-spacing:1px;margin-bottom:8px;'>MindMeter</div>
                <div style='font-size:1.1rem;color:#64748b;'>Lịch hẹn đã được xác nhận</div>
              </div>
              
              <div style='margin-bottom:24px;'>
                <h2 style='color:#1e293b;margin:0 0 16px 0;font-size:1.5rem;'>Xin chào %s,</h2>
                <p style='margin:0;line-height:1.6;color:#475569;font-size:1rem;'>
                  Tin vui! Lịch hẹn của bạn với chuyên gia <strong>%s</strong> đã được xác nhận thành công.
                </p>
              </div>
              
              <div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin:24px 0;'>
                <h3 style='color:#166534;margin:0 0 16px 0;font-size:1.25rem;'>✅ Lịch hẹn đã được xác nhận</h3>
                
                <div style='background:#fff;border-radius:8px;padding:16px;margin-bottom:12px;'>
                  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;'>
                    <span style='color:#64748b;font-size:0.875rem;'>Chuyên gia:</span>
                    <span style='color:#1e293b;font-weight:600;'>%s</span>
                  </div>
                  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;'>
                    <span style='color:#64748b;font-size:0.875rem;'>Thời gian:</span>
                    <span style='color:#1e293b;font-weight:600;'>%s</span>
                  </div>
                  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;'>
                    <span style='color:#64748b;font-size:0.875rem;'>Thời lượng:</span>
                    <span style='color:#1e293b;font-weight:600;'>%s</span>
                  </div>
                  <div style='display:flex;justify-content:space-between;align-items:center;'>
                    <span style='color:#64748b;font-size:0.875rem;'>Hình thức:</span>
                    <span style='color:#1e293b;font-weight:600;'>%s</span>
                  </div>
                </div>
                
                %s
                %s
                %s
              </div>
              
              <div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;'>
                <h3 style='color:#166534;margin:0 0 8px 0;font-size:1.125rem;'>📌 Lưu ý quan trọng</h3>
                <ul style='margin:0;padding-left:20px;color:#166534;line-height:1.5;'>
                  <li>Vui lòng có mặt đúng giờ để buổi tư vấn diễn ra suôn sẻ</li>
                  <li>Nếu có thay đổi, vui lòng hủy lịch hẹn trước 24 giờ</li>
                  <li>Chuẩn bị sẵn các câu hỏi hoặc vấn đề bạn muốn thảo luận</li>
                  <li>Đảm bảo kết nối internet ổn định nếu là tư vấn trực tuyến</li>
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
                    Email hỗ trợ
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
            studentName, expertName, expertName, appointmentDateTime, duration, consultationType, notes, expertNotes, meetingInfo
        );
    }
    
    /**
     * Generate HTML email template cho chuyên gia khi xác nhận lịch hẹn
     */
    private String generateConfirmationEmailForExpert(String expertName, String studentName, Appointment appointment, String frontendUrl) {
        String appointmentDateTime = formatDateTime(appointment);
        String consultationType = getConsultationTypeText(appointment.getConsultationType());
        String duration = appointment.getDurationMinutes() + " phút";
        
        return String.format("""
            <div style='max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);padding:32px;font-family:Segoe UI,Roboto,Arial,sans-serif;'>
              <div style='text-align:center;margin-bottom:32px;'>
                <div style='font-size:2rem;font-weight:700;color:#2563eb;letter-spacing:1px;margin-bottom:8px;'>MindMeter</div>
                <div style='font-size:1.1rem;color:#64748b;'>Xác nhận lịch hẹn thành công</div>
              </div>
              
              <div style='margin-bottom:24px;'>
                <h2 style='color:#1e293b;margin:0 0 16px 0;font-size:1.5rem;'>Xin chào %s,</h2>
                <p style='margin:0;line-height:1.6;color:#475569;font-size:1rem;'>
                  Bạn đã xác nhận thành công lịch hẹn với học sinh <strong>%s</strong>.
                </p>
              </div>
              
              <div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin:24px 0;'>
                <h3 style='color:#166534;margin:0 0 16px 0;font-size:1.25rem;'>✅ Lịch hẹn đã được xác nhận</h3>
                
                <div style='background:#fff;border-radius:8px;padding:16px;margin-bottom:12px;'>
                  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;'>
                    <span style='color:#64748b;font-size:0.875rem;'>Học sinh:</span>
                    <span style='color:#1e293b;font-weight:600;'>%s</span>
                  </div>
                  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;'>
                    <span style='color:#64748b;font-size:0.875rem;'>Email:</span>
                    <span style='color:#1e293b;font-weight:600;'>%s</span>
                  </div>
                  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;'>
                    <span style='color:#64748b;font-size:0.875rem;'>Thời gian:</span>
                    <span style='color:#1e293b;font-weight:600;'>%s</span>
                  </div>
                  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;'>
                    <span style='color:#64748b;font-size:0.875rem;'>Thời lượng:</span>
                    <span style='color:#1e293b;font-weight:600;'>%s</span>
                  </div>
                  <div style='display:flex;justify-content:space-between;align-items:center;'>
                    <span style='color:#64748b;font-size:0.875rem;'>Hình thức:</span>
                    <span style='color:#1e293b;font-weight:600;'>%s</span>
                  </div>
                </div>
              </div>
              
              <div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;'>
                <h3 style='color:#166534;margin:0 0 8px 0;font-size:1.125rem;'>📌 Lưu ý</h3>
                <ul style='margin:0;padding-left:20px;color:#166534;line-height:1.5;'>
                  <li>Học sinh/ sinh viên đã nhận được email thông báo xác nhận</li>
                  <li>Vui lòng chuẩn bị đầy đủ cho buổi tư vấn</li>
                  <li>Nếu có thay đổi, vui lòng thông báo cho học sinh sớm nhất có thể</li>
                </ul>
              </div>
              
              <div style='text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;'>
                <a href='%s/expert/appointments' style='display:inline-flex;align-items:center;gap:8px;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:500;font-size:1rem;'>
                  Xem lịch hẹn trong Dashboard
                </a>
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
            expertName, studentName, studentName, appointment.getStudent().getEmail(), 
            appointmentDateTime, duration, consultationType, frontendUrl
        );
    }
    
    /**
     * Helper để escape HTML
     */
    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\"", "&quot;")
                    .replace("'", "&#39;")
                    .replace("\n", "<br>");
    }
}

