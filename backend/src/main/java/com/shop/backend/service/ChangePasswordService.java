package com.shop.backend.service;

import com.shop.backend.model.User;
import com.shop.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChangePasswordService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private PasswordValidationService passwordValidationService;
    
    /**
     * Change temporary password to permanent password
     * @param email User's email address
     * @param newPassword New password to set
     * @throws RuntimeException if user not found or invalid state
     */
    @Transactional
    public void changeTemporaryPassword(String email, String newPassword) {
        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("Email không được để trống");
        }
        
        if (newPassword == null || newPassword.trim().isEmpty()) {
            throw new RuntimeException("Mật khẩu mới không được để trống");
        }
        
        if (newPassword.length() < 6) {
            throw new RuntimeException("Mật khẩu mới phải có ít nhất 6 ký tự");
        }
        
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với email: " + email));
        
        // Validate that user has temporary password
        if (!user.isTemporaryPassword()) {
            throw new RuntimeException("Người dùng này không có mật khẩu tạm thời");
        }
        
        // Update password
        user.setPassword(passwordEncoder.encode(newPassword.trim()));
        
        // Clear temporary password flags
        passwordValidationService.clearTemporaryPasswordFlags(user);
        
        System.out.println("[ChangePassword] Temporary password changed successfully for user: " + email);
    }
    
    /**
     * Change password for regular users (not temporary password)
     * @param email User's email address
     * @param currentPassword Current password for verification
     * @param newPassword New password to set
     * @throws RuntimeException if validation fails
     */
    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("Email không được để trống");
        }
        
        if (currentPassword == null || currentPassword.trim().isEmpty()) {
            throw new RuntimeException("Mật khẩu hiện tại không được để trống");
        }
        
        if (newPassword == null || newPassword.trim().isEmpty()) {
            throw new RuntimeException("Mật khẩu mới không được để trống");
        }
        
        if (newPassword.length() < 6) {
            throw new RuntimeException("Mật khẩu mới phải có ít nhất 6 ký tự");
        }
        
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với email: " + email));
        
        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Mật khẩu hiện tại không đúng");
        }
        
        // Update password
        user.setPassword(passwordEncoder.encode(newPassword.trim()));
        userRepository.save(user);
        
        System.out.println("[ChangePassword] Password changed successfully for user: " + email);
    }
    
    /**
     * Check if user can change their password
     * @param email User's email address
     * @return true if user can change password
     */
    public boolean canChangePassword(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        
        return userRepository.findByEmail(email.trim().toLowerCase())
                .map(user -> user.isTemporaryPassword() || !user.isAnonymous())
                .orElse(false);
    }
    
    /**
     * Get password change requirements for user
     * @param email User's email address
     * @return PasswordChangeInfo with requirements
     */
    public PasswordChangeInfo getPasswordChangeInfo(String email) {
        if (email == null || email.trim().isEmpty()) {
            return new PasswordChangeInfo(false, "Email không hợp lệ", false);
        }
        
        User user = userRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
        if (user == null) {
            return new PasswordChangeInfo(false, "Không tìm thấy người dùng", false);
        }
        
        if (user.isAnonymous()) {
            return new PasswordChangeInfo(false, "Tài khoản ẩn danh không thể đổi mật khẩu", false);
        }
        
        boolean isTemporary = user.isTemporaryPassword();
        String message = isTemporary ? 
            "Bạn cần đổi mật khẩu tạm thời" : 
            "Bạn có thể đổi mật khẩu bất kỳ lúc nào";
        
        return new PasswordChangeInfo(true, message, isTemporary);
    }
    
    /**
     * DTO class for password change information
     */
    public static class PasswordChangeInfo {
        private final boolean canChange;
        private final String message;
        private final boolean isTemporary;
        
        public PasswordChangeInfo(boolean canChange, String message, boolean isTemporary) {
            this.canChange = canChange;
            this.message = message;
            this.isTemporary = isTemporary;
        }
        
        public boolean canChange() {
            return canChange;
        }
        
        public String getMessage() {
            return message;
        }
        
        public boolean isTemporary() {
            return isTemporary;
        }
    }
}
