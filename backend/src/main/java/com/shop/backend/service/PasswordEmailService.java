package com.shop.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

@Service
public class PasswordEmailService {
    
    @Autowired
    private JavaMailSender mailSender;
    
    /**
     * Send auto-generated password to Google OAuth2 user
     * @param email User's email address
     * @param password Auto-generated password
     * @param firstName User's first name
     */
    public void sendPasswordEmail(String email, String password, String firstName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(email);
            helper.setSubject("[MindMeter] Mật khẩu tạm thời - Chỉ sử dụng 1 lần");
            
            String userName = (firstName != null && !firstName.trim().isEmpty()) ? firstName : "Người dùng";
            String html = generatePasswordEmail(userName, email, password);
            helper.setText(html, true);
            
            mailSender.send(message);
            
            System.out.println("[PasswordEmail] Password email sent successfully to: " + email);
            
        } catch (Exception e) {
            System.err.println("[PasswordEmail] Failed to send password email to " + email + ": " + e.getMessage());
            // Don't throw exception to avoid breaking OAuth2 flow
        }
    }
    
    /**
     * Generate HTML email template for password notification
     */
    private String generatePasswordEmail(String userName, String email, String password) {
        return String.format(
            "<div style='max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);padding:32px;font-family:Segoe UI,Roboto,Arial,sans-serif;'>" +
            "<div style='text-align:center;margin-bottom:32px;'>" +
            "<div style='font-size:2rem;font-weight:700;color:#2563eb;letter-spacing:1px;margin-bottom:8px;'>MindMeter</div>" +
            "<div style='font-size:1.1rem;color:#64748b;'>Chào mừng bạn đến với hệ thống đánh giá sức khỏe tâm thần</div>" +
            "</div>" +
            "<div style='margin-bottom:24px;'>" +
            "<h2 style='color:#1e293b;margin:0 0 16px 0;font-size:1.5rem;'>Xin chào %s,</h2>" +
            "<p style='margin:0;line-height:1.6;color:#475569;font-size:1rem;'>" +
            "Chúng tôi đã tạo tài khoản MindMeter cho bạn sau khi bạn đăng nhập bằng Google. " +
            "Dưới đây là <strong>mật khẩu tạm thời</strong> của bạn (chỉ sử dụng được 1 lần):" +
            "</p>" +
            "</div>" +
            "<div style='background:#f8fafc;border:2px solid #e2e8f0;border-radius:12px;padding:24px;margin:24px 0;'>" +
            "<h3 style='color:#1e293b;margin:0 0 16px 0;font-size:1.25rem;'>🔐 Thông tin đăng nhập</h3>" +
            "<div style='margin-bottom:16px;'>" +
            "<div style='font-size:0.875rem;color:#64748b;margin-bottom:4px;'>Email</div>" +
            "<div style='font-size:1.125rem;font-weight:600;color:#1e293b;background:#fff;padding:12px;border-radius:8px;border:1px solid #e2e8f0;'>%s</div>" +
            "</div>" +
            "<div style='margin-bottom:16px;'>" +
            "<div style='font-size:0.875rem;color:#64748b;margin-bottom:4px;'>Mật khẩu tạm thời</div>" +
            "<div style='font-size:1.125rem;font-weight:600;color:#dc2626;background:#fef2f2;padding:12px;border-radius:8px;border:2px solid #fecaca;font-family:monospace;letter-spacing:1px;'>%s</div>" +
            "</div>" +
            "<div style='background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin-top:16px;'>" +
            "<div style='display:flex;align-items:center;margin-bottom:8px;'>" +
            "<span style='font-size:1.25rem;margin-right:8px;'>!</span>" +
            "<h4 style='color:#92400e;margin:0;font-size:1rem;'>Lưu ý bảo mật</h4>" +
            "</div>" +
            "<p style='margin:0;color:#92400e;font-size:0.875rem;line-height:1.5;'>" +
            "<strong>QUAN TRỌNG:</strong> Mật khẩu này chỉ sử dụng được 1 lần duy nhất! " +
            "Sau khi đăng nhập lần đầu, bạn sẽ BẮT BUỘC phải đổi mật khẩu mới. " +
            "Không chia sẻ thông tin này với ai khác." +
            "</p>" +
            "</div>" +
            "</div>" +
            "<div style='background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin:16px 0;'>" +
            "<h3 style='color:#0369a1;margin:0 0 8px 0;font-size:1.125rem;'>📱 Cách đăng nhập</h3>" +
            "<ol style='margin:0;padding-left:20px;color:#0c4a6e;line-height:1.6;'>" +
            "<li>Truy cập trang đăng nhập của MindMeter</li>" +
            "<li>Sử dụng email và <strong>mật khẩu tạm thời</strong> ở trên</li>" +
            "<li>Sau khi đăng nhập, hệ thống sẽ yêu cầu bạn đổi mật khẩu mới</li>" +
            "<li>Hoặc tiếp tục đăng nhập bằng Google như bình thường</li>" +
            "</ol>" +
            "</div>" +
            "<div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;'>" +
            "<h3 style='color:#166534;margin:0 0 8px 0;font-size:1.125rem;'>🔒 Đổi mật khẩu (BẮT BUỘC)</h3>" +
            "<ul style='margin:0;padding-left:20px;color:#166534;line-height:1.5;'>" +
            "<li><strong>BẮT BUỘC:</strong> Sau khi đăng nhập lần đầu với mật khẩu tạm thời</li>" +
            "<li>Hệ thống sẽ tự động yêu cầu bạn đổi mật khẩu</li>" +
            "<li>Tạo mật khẩu mới an toàn và dễ nhớ</li>" +
            "<li>Lưu lại mật khẩu mới ở nơi an toàn</li>" +
            "</ul>" +
            "</div>" +
            "<div style='text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;'>" +
            "<p style='margin:0 0 16px 0;color:#64748b;font-size:0.875rem;'>" +
            "Nếu có bất kỳ thắc mắc nào, hãy liên hệ với chúng tôi:" +
            "</p>" +
            "<div style='display:flex;justify-content:center;gap:16px;flex-wrap:wrap;'>" +
            "<a href='tel:0369702376' style='display:inline-flex;align-items:center;gap:8px;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:500;'>" +
            "0369 702 376" +
            "</a>" +
            "<a href='mailto:trankiencuong30072003@gmail.com' style='display:inline-flex;align-items:center;gap:8px;padding:12px 20px;background:#10b981;color:#fff;text-decoration:none;border-radius:8px;font-weight:500;'>" +
            "Email hỗ trợ" +
            "</a>" +
            "</div>" +
            "</div>" +
            "<div style='text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;'>" +
            "<p style='margin:0;color:#94a3b8;font-size:0.875rem;line-height:1.5;'>" +
            "Trân trọng,<br>" +
            "<strong>Đội ngũ MindMeter</strong><br>" +
            "<span style='font-size:0.8rem;'>Hỗ trợ sức khỏe tâm thần 24/7</span>" +
            "</p>" +
            "</div>" +
            "<div style='margin-top:24px;padding:16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;'>" +
            "<p style='margin:0;color:#991b1b;font-size:0.8rem;line-height:1.4;text-align:center;'>" +
            "<strong>BẢO MẬT NGHIÊM NGẶT:</strong> Email này chứa mật khẩu tạm thời chỉ dùng 1 lần. " +
            "Vui lòng không chuyển tiếp hoặc chia sẻ với bất kỳ ai. " +
            "Nếu bạn không tạo tài khoản này, vui lòng liên hệ hỗ trợ ngay lập tức." +
            "</p>" +
            "</div>" +
            "</div>", 
            userName, 
            email, 
            password
        );
    }
}
