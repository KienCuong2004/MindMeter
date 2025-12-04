package com.shop.backend.service;

import com.shop.backend.dto.NewsletterSubscriptionDTO;
import com.shop.backend.model.NewsletterSubscription;
import com.shop.backend.model.User;
import com.shop.backend.repository.NewsletterSubscriptionRepository;
import com.shop.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import jakarta.mail.MessagingException;

@Service
@RequiredArgsConstructor
@Slf4j
public class NewsletterService {
    
    private final NewsletterSubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;
    
    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;
    
    /**
     * Subscribe to newsletter
     */
    @Transactional
    public NewsletterSubscription subscribe(NewsletterSubscriptionDTO dto) {
        Optional<NewsletterSubscription> existing = subscriptionRepository.findByEmail(dto.getEmail().toLowerCase());
        
        if (existing.isPresent()) {
            NewsletterSubscription subscription = existing.get();
            if (subscription.getIsActive()) {
                throw new RuntimeException("Email này đã đăng ký nhận bản tin");
            }
            // Reactivate subscription
            subscription.setIsActive(true);
            subscription.setUnsubscribedAt(null);
            subscription.setSubscribedAt(LocalDateTime.now());
            subscription.setVerificationToken(generateVerificationToken());
            subscription.setIsVerified(false);
            subscription = subscriptionRepository.save(subscription);
            
            sendVerificationEmail(subscription);
            return subscription;
        }
        
        // Check if user exists
        Optional<User> userOpt = userRepository.findByEmail(dto.getEmail().toLowerCase());
        
        NewsletterSubscription subscription = new NewsletterSubscription();
        subscription.setEmail(dto.getEmail().toLowerCase());
        subscription.setFirstName(dto.getFirstName());
        subscription.setLastName(dto.getLastName());
        subscription.setIsActive(true);
        subscription.setIsVerified(false);
        subscription.setVerificationToken(generateVerificationToken());
        subscription.setSubscribedAt(LocalDateTime.now());
        
        if (userOpt.isPresent()) {
            subscription.setUser(userOpt.get());
        }
        
        subscription = subscriptionRepository.save(subscription);
        
        sendVerificationEmail(subscription);
        return subscription;
    }
    
    /**
     * Unsubscribe from newsletter
     */
    @Transactional
    public void unsubscribe(String email) {
        Optional<NewsletterSubscription> subscriptionOpt = subscriptionRepository.findByEmail(email.toLowerCase());
        if (subscriptionOpt.isPresent()) {
            NewsletterSubscription subscription = subscriptionOpt.get();
            subscription.setIsActive(false);
            subscription.setUnsubscribedAt(LocalDateTime.now());
            subscriptionRepository.save(subscription);
        }
    }
    
    /**
     * Verify subscription
     */
    @Transactional
    public boolean verifySubscription(String token) {
        Optional<NewsletterSubscription> subscriptionOpt = subscriptionRepository.findByVerificationToken(token);
        if (subscriptionOpt.isPresent()) {
            NewsletterSubscription subscription = subscriptionOpt.get();
            subscription.setIsVerified(true);
            subscription.setVerifiedAt(LocalDateTime.now());
            subscriptionRepository.save(subscription);
            return true;
        }
        return false;
    }
    
    /**
     * Get all active verified subscribers
     */
    public List<NewsletterSubscription> getActiveSubscribers() {
        return subscriptionRepository.findByIsActiveTrueAndIsVerifiedTrue();
    }
    
    /**
     * Send newsletter to all subscribers
     */
    public void sendNewsletter(String subject, String content, Long blogPostId) {
        List<NewsletterSubscription> subscribers = getActiveSubscribers();
        String blogPostUrl = frontendUrl + "/blog/post/" + blogPostId;
        
        for (NewsletterSubscription subscriber : subscribers) {
            try {
                sendNewsletterEmail(subscriber, subject, content, blogPostUrl);
            } catch (Exception e) {
                log.error("Failed to send newsletter to {}: {}", subscriber.getEmail(), e.getMessage());
            }
        }
        
        log.info("Sent newsletter to {} subscribers", subscribers.size());
    }
    
    /**
     * Generate verification token
     */
    private String generateVerificationToken() {
        return UUID.randomUUID().toString();
    }
    
    /**
     * Send verification email
     */
    private void sendVerificationEmail(NewsletterSubscription subscription) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(subscription.getEmail());
            helper.setSubject("[MindMeter] Xác nhận đăng ký nhận bản tin");
            
            String verificationUrl = frontendUrl + "/newsletter/verify?token=" + subscription.getVerificationToken();
            String html = generateVerificationEmailHtml(subscription.getFirstName(), verificationUrl);
            
            helper.setText(html, true);
            mailSender.send(message);
            
            log.info("Verification email sent to: {}", subscription.getEmail());
        } catch (Exception e) {
            log.error("Failed to send verification email: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Send newsletter email
     */
    private void sendNewsletterEmail(NewsletterSubscription subscription, String subject, String content, String blogPostUrl) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(subscription.getEmail());
            helper.setSubject("[MindMeter Newsletter] " + subject);
            
            String name = subscription.getFirstName() != null 
                ? subscription.getFirstName() 
                : "Bạn";
            
            String html = generateNewsletterEmailHtml(name, subject, content, blogPostUrl);
            helper.setText(html, true);
            
            mailSender.send(message);
        } catch (MessagingException e) {
            log.error("Failed to send newsletter email: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to send newsletter email", e);
        } catch (Exception e) {
            log.error("Failed to send newsletter email: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Generate verification email HTML
     */
    private String generateVerificationEmailHtml(String firstName, String verificationUrl) {
        String name = firstName != null ? firstName : "Bạn";
        return String.format("""
            <div style='max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);padding:32px;font-family:Segoe UI,Roboto,Arial,sans-serif;'>
              <div style='text-align:center;margin-bottom:32px;'>
                <div style='font-size:2rem;font-weight:700;color:#2563eb;letter-spacing:1px;margin-bottom:8px;'>MindMeter</div>
                <div style='font-size:1.1rem;color:#64748b;'>Xác nhận đăng ký nhận bản tin</div>
              </div>
              
              <div style='margin-bottom:24px;'>
                <h2 style='color:#1e293b;margin:0 0 16px 0;font-size:1.5rem;'>Xin chào %s,</h2>
                <p style='margin:0;line-height:1.6;color:#475569;font-size:1rem;'>
                  Cảm ơn bạn đã đăng ký nhận bản tin từ MindMeter! Để hoàn tất đăng ký, vui lòng xác nhận email của bạn bằng cách nhấp vào nút bên dưới.
                </p>
              </div>
              
              <div style='text-align:center;margin:32px 0;'>
                <a href='%s' style='display:inline-flex;align-items:center;gap:8px;padding:14px 28px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:1rem;'>
                  Xác nhận đăng ký
                </a>
              </div>
              
              <div style='background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin:16px 0;'>
                <p style='margin:0;color:#0369a1;line-height:1.5;font-size:0.875rem;'>
                  Nếu nút không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:<br>
                  <a href='%s' style='color:#2563eb;word-break:break-all;'>%s</a>
                </p>
              </div>
              
              <div style='text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;'>
                <p style='margin:0;color:#94a3b8;font-size:0.875rem;line-height:1.5;'>
                  Trân trọng,<br>
                  <strong>Đội ngũ MindMeter</strong>
                </p>
              </div>
            </div>
            """, name, verificationUrl, verificationUrl, verificationUrl);
    }
    
    /**
     * Generate newsletter email HTML
     */
    private String generateNewsletterEmailHtml(String name, String subject, String content, String blogPostUrl) {
        return String.format("""
            <div style='max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);padding:32px;font-family:Segoe UI,Roboto,Arial,sans-serif;'>
              <div style='text-align:center;margin-bottom:32px;'>
                <div style='font-size:2rem;font-weight:700;color:#2563eb;letter-spacing:1px;margin-bottom:8px;'>MindMeter</div>
                <div style='font-size:1.1rem;color:#64748b;'>Bản tin sức khỏe tâm thần</div>
              </div>
              
              <div style='margin-bottom:24px;'>
                <h2 style='color:#1e293b;margin:0 0 16px 0;font-size:1.5rem;'>Xin chào %s,</h2>
                <h3 style='color:#2563eb;margin:0 0 16px 0;font-size:1.25rem;'>%s</h3>
              </div>
              
              <div style='margin-bottom:24px;color:#475569;line-height:1.8;font-size:1rem;'>
                %s
              </div>
              
              <div style='text-align:center;margin:32px 0;'>
                <a href='%s' style='display:inline-flex;align-items:center;gap:8px;padding:14px 28px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:1rem;'>
                  Đọc bài viết đầy đủ
                </a>
              </div>
              
              <div style='text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;'>
                <p style='margin:0 0 16px 0;color:#64748b;font-size:0.875rem;'>
                  Không muốn nhận email này nữa? 
                  <a href='%s/newsletter/unsubscribe?email=%s' style='color:#2563eb;'>Hủy đăng ký</a>
                </p>
                <p style='margin:0;color:#94a3b8;font-size:0.875rem;line-height:1.5;'>
                  Trân trọng,<br>
                  <strong>Đội ngũ MindMeter</strong>
                </p>
              </div>
            </div>
            """, name, subject, content, blogPostUrl, frontendUrl, "{email}");
    }
}

