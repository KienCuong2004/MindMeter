package com.shop.backend.validation;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.regex.Pattern;
import java.util.Arrays;
import java.util.List;

/**
 * Service for input validation and sanitization
 * Prevents various security vulnerabilities
 */
@Service
public class InputValidationService {

    // Logger removed as it's not used in this implementation

    // Email validation pattern
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    );

    // Phone validation pattern (Vietnamese format)
    private static final Pattern PHONE_PATTERN = Pattern.compile(
        "^(\\+84|0)[0-9]{9,10}$"
    );

    // Allowed file types for uploads
    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
        "image/jpeg",
        "image/jpg", 
        "image/png",
        "image/gif",
        "image/webp"
    );

    // Allowed file extensions
    private static final List<String> ALLOWED_IMAGE_EXTENSIONS = Arrays.asList(
        ".jpg", ".jpeg", ".png", ".gif", ".webp"
    );

    // Maximum file size (5MB)
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    // Maximum text length
    private static final int MAX_TEXT_LENGTH = 10000;

    /**
     * Validate email format
     */
    public boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        return EMAIL_PATTERN.matcher(email.trim()).matches();
    }

    /**
     * Validate phone number format
     */
    public boolean isValidPhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return false;
        }
        return PHONE_PATTERN.matcher(phone.trim()).matches();
    }

    /**
     * Validate text length and content
     */
    public boolean isValidText(String text, int maxLength) {
        if (text == null) {
            return false;
        }
        return text.length() <= maxLength && text.length() > 0;
    }

    /**
     * Validate text for general use
     */
    public boolean isValidText(String text) {
        return isValidText(text, MAX_TEXT_LENGTH);
    }

    /**
     * Sanitize text input
     */
    public String sanitizeText(String text) {
        if (text == null) {
            return "";
        }
        
        // Remove potential XSS patterns
        return text.trim()
            .replaceAll("<script[^>]*>.*?</script>", "")
            .replaceAll("javascript:", "")
            .replaceAll("on\\w+\\s*=", "")
            .replaceAll("\\b(alert|confirm|prompt)\\s*\\(", "");
    }

    /**
     * Validate file upload
     */
    public ValidationResult validateFile(MultipartFile file) {
        ValidationResult result = new ValidationResult();
        
        if (file == null || file.isEmpty()) {
            result.setValid(false);
            result.setMessage("File không được để trống");
            return result;
        }

        // Check file size
        if (file.getSize() > MAX_FILE_SIZE) {
            result.setValid(false);
            result.setMessage("File quá lớn. Vui lòng chọn file nhỏ hơn 5MB");
            return result;
        }

        // Check content type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            result.setValid(false);
            result.setMessage("Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP)");
            return result;
        }

        // Check file extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            result.setValid(false);
            result.setMessage("Tên file không hợp lệ");
            return result;
        }

        String extension = originalFilename.toLowerCase();
        boolean hasValidExtension = ALLOWED_IMAGE_EXTENSIONS.stream()
            .anyMatch(ext -> extension.endsWith(ext));

        if (!hasValidExtension) {
            result.setValid(false);
            result.setMessage("Định dạng file không được hỗ trợ");
            return result;
        }

        // Check for potential security issues in filename
        if (originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
            result.setValid(false);
            result.setMessage("Tên file chứa ký tự không hợp lệ");
            return result;
        }

        result.setValid(true);
        result.setMessage("File hợp lệ");
        return result;
    }

    /**
     * Validate password strength
     */
    public ValidationResult validatePassword(String password) {
        ValidationResult result = new ValidationResult();
        
        if (password == null || password.length() < 8) {
            result.setValid(false);
            result.setMessage("Mật khẩu phải có ít nhất 8 ký tự");
            return result;
        }

        if (password.length() > 128) {
            result.setValid(false);
            result.setMessage("Mật khẩu quá dài");
            return result;
        }

        // Check for common weak passwords
        if (password.equalsIgnoreCase("password") || 
            password.equalsIgnoreCase("12345678") ||
            password.equalsIgnoreCase("qwerty123")) {
            result.setValid(false);
            result.setMessage("Mật khẩu quá yếu, vui lòng chọn mật khẩu khác");
            return result;
        }

        result.setValid(true);
        result.setMessage("Mật khẩu hợp lệ");
        return result;
    }

    /**
     * Validate JWT token format
     */
    public boolean isValidJwtFormat(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }
        
        // JWT should have 3 parts separated by dots
        String[] parts = token.split("\\.");
        return parts.length == 3;
    }

    /**
     * Validation result class
     */
    public static class ValidationResult {
        private boolean valid;
        private String message;

        public boolean isValid() {
            return valid;
        }

        public void setValid(boolean valid) {
            this.valid = valid;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
