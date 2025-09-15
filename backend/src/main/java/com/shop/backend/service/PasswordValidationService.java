package com.shop.backend.service;

import com.shop.backend.model.User;
import com.shop.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PasswordValidationService {
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Check if user has a temporary password that hasn't been used yet
     * @param user The user to check
     * @return true if user has unused temporary password
     */
    public boolean isTemporaryPassword(User user) {
        return user != null && 
               user.isTemporaryPassword() && 
               !user.isTempPasswordUsed();
    }
    
    /**
     * Check if user has a temporary password by email
     * @param email User's email address
     * @return true if user has unused temporary password
     */
    public boolean isTemporaryPassword(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        
        return userRepository.findByEmail(email.trim().toLowerCase())
                .map(this::isTemporaryPassword)
                .orElse(false);
    }
    
    /**
     * Mark temporary password as used after first login
     * @param user The user whose temporary password was used
     */
    @Transactional
    public void markTemporaryPasswordAsUsed(User user) {
        if (user != null && user.isTemporaryPassword() && !user.isTempPasswordUsed()) {
            user.setTempPasswordUsed(true);
            userRepository.save(user);
            
            System.out.println("[PasswordValidation] Temporary password marked as used for user: " + user.getEmail());
        }
    }
    
    /**
     * Mark temporary password as used by email
     * @param email User's email address
     */
    @Transactional
    public void markTemporaryPasswordAsUsed(String email) {
        if (email == null || email.trim().isEmpty()) {
            return;
        }
        
        userRepository.findByEmail(email.trim().toLowerCase())
                .ifPresent(this::markTemporaryPasswordAsUsed);
    }
    
    /**
     * Clear temporary password flags after user sets new password
     * @param user The user who set a new password
     */
    @Transactional
    public void clearTemporaryPasswordFlags(User user) {
        if (user != null && user.isTemporaryPassword()) {
            user.setTemporaryPassword(false);
            user.setTempPasswordUsed(false);
            userRepository.save(user);
            
            System.out.println("[PasswordValidation] Temporary password flags cleared for user: " + user.getEmail());
        }
    }
    
    /**
     * Check if user needs to change their temporary password
     * @param user The user to check
     * @return true if user has temporary password that needs to be changed
     */
    public boolean requiresPasswordChange(User user) {
        return user != null && 
               user.isTemporaryPassword() && 
               user.isTempPasswordUsed();
    }
    
    /**
     * Check if user needs to change their temporary password by email
     * @param email User's email address
     * @return true if user has temporary password that needs to be changed
     */
    public boolean requiresPasswordChange(String email) {
        System.out.println("[PasswordValidationService] Checking requiresPasswordChange for: " + email);
        
        if (email == null || email.trim().isEmpty()) {
            System.out.println("[PasswordValidationService] Email is null or empty");
            return false;
        }
        
        return userRepository.findByEmail(email.trim().toLowerCase())
                .map(user -> {
                    System.out.println("[PasswordValidationService] User found - isTemporaryPassword: " + user.isTemporaryPassword() + ", tempPasswordUsed: " + user.isTempPasswordUsed());
                    // For Option 3: Allow password change for users with temporary password (used or unused)
                    boolean result = user != null && user.isTemporaryPassword();
                    System.out.println("[PasswordValidationService] requiresPasswordChange result: " + result);
                    return result;
                })
                .orElse(false);
    }
    
    /**
     * Get password status information for user
     * @param user The user to check
     * @return PasswordStatus enum indicating current state
     */
    public PasswordStatus getPasswordStatus(User user) {
        if (user == null) {
            return PasswordStatus.INVALID;
        }
        
        if (!user.isTemporaryPassword()) {
            return PasswordStatus.PERMANENT;
        }
        
        if (user.isTempPasswordUsed()) {
            return PasswordStatus.TEMP_USED;
        }
        
        return PasswordStatus.TEMP_UNUSED;
    }
    
    /**
     * Enum representing different password states
     */
    public enum PasswordStatus {
        PERMANENT,      // User has a permanent password
        TEMP_UNUSED,    // User has unused temporary password
        TEMP_USED,      // User has used temporary password (needs change)
        INVALID         // Invalid user or state
    }
}
