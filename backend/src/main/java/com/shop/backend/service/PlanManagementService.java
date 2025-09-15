package com.shop.backend.service;

import com.shop.backend.model.User;
import com.shop.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlanManagementService {
    
    private final UserRepository userRepository;
    
    /**
     * Kiểm tra và reset các plan đã hết hạn về FREE
     * Chạy mỗi ngày lúc 00:00
     */
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void checkAndResetExpiredPlans() {
        log.info("Bắt đầu kiểm tra và reset các plan đã hết hạn...");
        
        LocalDateTime now = LocalDateTime.now();
        
        // Tìm tất cả users có plan PLUS hoặc PRO đã hết hạn
        List<User> expiredUsers = userRepository.findByPlanInAndPlanExpiryDateBefore(
            List.of("PLUS", "PRO"), now
        );
        
        if (expiredUsers.isEmpty()) {
            log.info("Không có plan nào cần reset");
            return;
        }
        
        log.info("Tìm thấy {} users cần reset plan về FREE", expiredUsers.size());
        
        for (User user : expiredUsers) {
            try {
                // Reset plan về FREE
                user.setPlan("FREE");
                user.setPlanStartDate(null);
                user.setPlanExpiryDate(null);
                
                userRepository.save(user);
                
                log.info("Đã reset plan của user {} (email: {}) từ {} về FREE", 
                    user.getId(), user.getEmail(), user.getPlan());
                    
            } catch (Exception e) {
                log.error("Lỗi khi reset plan cho user {}: {}", user.getId(), e.getMessage());
            }
        }
        
        log.info("Hoàn thành việc reset plan. Đã xử lý {} users", expiredUsers.size());
    }
    
    /**
     * Cập nhật plan cho user khi mua gói mới
     */
    @Transactional
    public void updateUserPlan(User user, String newPlan) {
        LocalDateTime now = LocalDateTime.now();
        
        // Set plan start date
        user.setPlanStartDate(now);
        
        // Set plan expiry date (30 ngày từ ngày mua)
        LocalDateTime expiryDate = now.plusDays(30);
        user.setPlanExpiryDate(expiryDate);
        
        // Cập nhật plan
        user.setPlan(newPlan);
        
        userRepository.save(user);
        
        log.info("Đã cập nhật plan cho user {}: {} -> {} (hết hạn: {})", 
            user.getId(), user.getPlan(), newPlan, expiryDate);
    }
    
    /**
     * Kiểm tra xem plan của user có còn hạn không
     */
    public boolean isPlanActive(User user) {
        if ("FREE".equals(user.getPlan())) {
            return true; // Gói FREE luôn active
        }
        
        if (user.getPlanExpiryDate() == null) {
            return false; // Không có expiry date
        }
        
        return LocalDateTime.now().isBefore(user.getPlanExpiryDate());
    }
    
    /**
     * Lấy số ngày còn lại của plan
     */
    public long getDaysRemaining(User user) {
        if ("FREE".equals(user.getPlan()) || user.getPlanExpiryDate() == null) {
            return 0;
        }
        
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(user.getPlanExpiryDate())) {
            return 0; // Đã hết hạn
        }
        
        return java.time.Duration.between(now, user.getPlanExpiryDate()).toDays();
    }
}
