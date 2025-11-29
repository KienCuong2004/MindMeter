package com.shop.backend.controller;

import com.shop.backend.service.ChangePasswordService;
import com.shop.backend.service.PasswordValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/password")
@CrossOrigin(origins = "*")
public class PasswordController {
    
    @Autowired
    private ChangePasswordService changePasswordService;
    
    @Autowired
    private PasswordValidationService passwordValidationService;
    
    /**
     * Change temporary password to permanent password
     * POST /api/password/change-temporary
     */
    @PostMapping("/change-temporary")
    public ResponseEntity<?> changeTemporaryPassword(@RequestBody ChangeTemporaryPasswordRequest request) {
        try {
            // Get current user from JWT token
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            
            // Validate request
            if (request.getNewPassword() == null || request.getNewPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Mật khẩu mới không được để trống"));
            }
            
            if (request.getNewPassword().length() < 6) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Mật khẩu mới phải có ít nhất 6 ký tự"));
            }
            
            // Check if user has temporary password
            boolean requiresChange = passwordValidationService.requiresPasswordChange(email);
            
            if (!requiresChange) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Tài khoản này không có mật khẩu tạm thời"));
            }
            
            // Change temporary password
            changePasswordService.changeTemporaryPassword(email, request.getNewPassword());
            
            return ResponseEntity.ok(new SuccessResponse("Đổi mật khẩu thành công!"));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * Check password change requirements for current user
     * GET /api/password/requirements
     */
    @GetMapping("/requirements")
    public ResponseEntity<?> getPasswordRequirements() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            
            ChangePasswordService.PasswordChangeInfo info = changePasswordService.getPasswordChangeInfo(email);
            
            return ResponseEntity.ok(info);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * Change password for regular users (not temporary password)
     * POST /api/password/change
     */
    @PostMapping("/change")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            
            // Validate request
            if (request.getCurrentPassword() == null || request.getCurrentPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Mật khẩu hiện tại không được để trống"));
            }
            
            if (request.getNewPassword() == null || request.getNewPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Mật khẩu mới không được để trống"));
            }
            
            if (request.getNewPassword().length() < 6) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Mật khẩu mới phải có ít nhất 6 ký tự"));
            }
            
            // Change password
            changePasswordService.changePassword(email, request.getCurrentPassword(), request.getNewPassword());
            
            return ResponseEntity.ok(new SuccessResponse("Đổi mật khẩu thành công!"));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * Request DTOs
     */
    public static class ChangeTemporaryPasswordRequest {
        private String newPassword;
        
        public String getNewPassword() {
            return newPassword;
        }
        
        public void setNewPassword(String newPassword) {
            this.newPassword = newPassword;
        }
    }
    
    public static class ChangePasswordRequest {
        private String currentPassword;
        private String newPassword;
        
        public String getCurrentPassword() {
            return currentPassword;
        }
        
        public void setCurrentPassword(String currentPassword) {
            this.currentPassword = currentPassword;
        }
        
        public String getNewPassword() {
            return newPassword;
        }
        
        public void setNewPassword(String newPassword) {
            this.newPassword = newPassword;
        }
    }
    
    public static class SuccessResponse {
        private String message;
        
        public SuccessResponse(String message) {
            this.message = message;
        }
        
        public String getMessage() {
            return message;
        }
        
        public void setMessage(String message) {
            this.message = message;
        }
    }
    
    public static class ErrorResponse {
        private String error;
        
        public ErrorResponse(String error) {
            this.error = error;
        }
        
        public String getError() {
            return error;
        }
        
        public void setError(String error) {
            this.error = error;
        }
    }
}
