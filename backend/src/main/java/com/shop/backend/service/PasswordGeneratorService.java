package com.shop.backend.service;

import org.springframework.stereotype.Service;
import java.security.SecureRandom;

@Service
public class PasswordGeneratorService {
    
    // Characters for password generation
    private static final String UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS = "0123456789";
    private static final String SPECIAL_CHARS = "!@#$%^&*";
    
    // Combine all characters
    private static final String ALL_CHARS = UPPERCASE + LOWERCASE + DIGITS + SPECIAL_CHARS;
    
    private final SecureRandom secureRandom = new SecureRandom();
    
    /**
     * Generate a secure password with the following criteria:
     * - Length: 12 characters
     * - At least 1 uppercase letter
     * - At least 1 lowercase letter  
     * - At least 1 digit
     * - At least 1 special character
     * - Uses SecureRandom for cryptographic security
     */
    public String generateSecurePassword() {
        StringBuilder password = new StringBuilder(12);
        
        // Ensure at least one character from each category
        password.append(getRandomChar(UPPERCASE));
        password.append(getRandomChar(LOWERCASE));
        password.append(getRandomChar(DIGITS));
        password.append(getRandomChar(SPECIAL_CHARS));
        
        // Fill remaining positions with random characters
        for (int i = 4; i < 12; i++) {
            password.append(getRandomChar(ALL_CHARS));
        }
        
        // Shuffle the password to avoid predictable patterns
        return shuffleString(password.toString());
    }
    
    /**
     * Get a random character from the given character set
     */
    private char getRandomChar(String charSet) {
        return charSet.charAt(secureRandom.nextInt(charSet.length()));
    }
    
    /**
     * Shuffle the characters in the password to avoid predictable patterns
     */
    private String shuffleString(String input) {
        char[] characters = input.toCharArray();
        
        // Fisher-Yates shuffle algorithm
        for (int i = characters.length - 1; i > 0; i--) {
            int j = secureRandom.nextInt(i + 1);
            char temp = characters[i];
            characters[i] = characters[j];
            characters[j] = temp;
        }
        
        return new String(characters);
    }
    
    /**
     * Generate a simpler password for testing purposes
     * (8 characters, no special characters)
     */
    public String generateSimplePassword() {
        StringBuilder password = new StringBuilder(8);
        
        // Ensure at least one character from each category
        password.append(getRandomChar(UPPERCASE));
        password.append(getRandomChar(LOWERCASE));
        password.append(getRandomChar(DIGITS));
        
        // Fill remaining positions
        String simpleChars = UPPERCASE + LOWERCASE + DIGITS;
        for (int i = 3; i < 8; i++) {
            password.append(getRandomChar(simpleChars));
        }
        
        return shuffleString(password.toString());
    }
}
