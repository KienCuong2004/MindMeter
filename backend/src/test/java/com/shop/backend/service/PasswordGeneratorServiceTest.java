package com.shop.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class PasswordGeneratorServiceTest {

    @InjectMocks
    private PasswordGeneratorService passwordGeneratorService;

    @BeforeEach
    void setUp() {
        passwordGeneratorService = new PasswordGeneratorService();
    }

    @Test
    void generateSecurePassword_ShouldReturnPasswordWithCorrectLength() {
        // When
        String password = passwordGeneratorService.generateSecurePassword();

        // Then
        assertNotNull(password);
        assertEquals(12, password.length());
    }

    @Test
    void generateSecurePassword_ShouldContainAtLeastOneUppercase() {
        // When
        String password = passwordGeneratorService.generateSecurePassword();

        // Then
        assertTrue(password.matches(".*[A-Z].*"), "Password should contain at least one uppercase letter");
    }

    @Test
    void generateSecurePassword_ShouldContainAtLeastOneLowercase() {
        // When
        String password = passwordGeneratorService.generateSecurePassword();

        // Then
        assertTrue(password.matches(".*[a-z].*"), "Password should contain at least one lowercase letter");
    }

    @Test
    void generateSecurePassword_ShouldContainAtLeastOneDigit() {
        // When
        String password = passwordGeneratorService.generateSecurePassword();

        // Then
        assertTrue(password.matches(".*[0-9].*"), "Password should contain at least one digit");
    }

    @Test
    void generateSecurePassword_ShouldContainAtLeastOneSpecialCharacter() {
        // When
        String password = passwordGeneratorService.generateSecurePassword();

        // Then
        assertTrue(password.matches(".*[!@#$%^&*].*"), "Password should contain at least one special character");
    }

    @Test
    void generateSecurePassword_ShouldGenerateDifferentPasswords() {
        // When
        String password1 = passwordGeneratorService.generateSecurePassword();
        String password2 = passwordGeneratorService.generateSecurePassword();

        // Then
        assertNotEquals(password1, password2, "Generated passwords should be different");
    }

    @Test
    void generateSecurePassword_ShouldOnlyContainAllowedCharacters() {
        // Given
        Pattern allowedPattern = Pattern.compile("^[A-Za-z0-9!@#$%^&*]+$");

        // When
        String password = passwordGeneratorService.generateSecurePassword();

        // Then
        assertTrue(allowedPattern.matcher(password).matches(), 
            "Password should only contain allowed characters: A-Z, a-z, 0-9, !@#$%^&*");
    }

    @Test
    void generateSecurePassword_ShouldNotBeNull() {
        // When
        String password = passwordGeneratorService.generateSecurePassword();

        // Then
        assertNotNull(password, "Generated password should not be null");
    }

    @Test
    void generateSecurePassword_ShouldNotBeEmpty() {
        // When
        String password = passwordGeneratorService.generateSecurePassword();

        // Then
        assertFalse(password.isEmpty(), "Generated password should not be empty");
    }

    @Test
    void generateSecurePassword_ShouldNotContainSpaces() {
        // When
        String password = passwordGeneratorService.generateSecurePassword();

        // Then
        assertFalse(password.contains(" "), "Password should not contain spaces");
    }

    @Test
    void generateSecurePassword_ShouldNotContainNewlines() {
        // When
        String password = passwordGeneratorService.generateSecurePassword();

        // Then
        assertFalse(password.contains("\n"), "Password should not contain newlines");
        assertFalse(password.contains("\r"), "Password should not contain carriage returns");
    }

    @Test
    void generateSecurePassword_ShouldMeetAllRequirements() {
        // When
        String password = passwordGeneratorService.generateSecurePassword();

        // Then
        assertNotNull(password);
        assertEquals(12, password.length());
        assertTrue(password.matches(".*[A-Z].*"), "Should contain uppercase");
        assertTrue(password.matches(".*[a-z].*"), "Should contain lowercase");
        assertTrue(password.matches(".*[0-9].*"), "Should contain digit");
        assertTrue(password.matches(".*[!@#$%^&*].*"), "Should contain special character");
        assertTrue(password.matches("^[A-Za-z0-9!@#$%^&*]+$"), "Should only contain allowed characters");
    }

    @Test
    void generateSecurePassword_ShouldBeConsistentAcrossMultipleCalls() {
        // When
        String password1 = passwordGeneratorService.generateSecurePassword();
        String password2 = passwordGeneratorService.generateSecurePassword();
        String password3 = passwordGeneratorService.generateSecurePassword();

        // Then
        assertNotNull(password1);
        assertNotNull(password2);
        assertNotNull(password3);
        
        // All passwords should meet requirements
        for (String password : new String[]{password1, password2, password3}) {
            assertEquals(12, password.length());
            assertTrue(password.matches(".*[A-Z].*"));
            assertTrue(password.matches(".*[a-z].*"));
            assertTrue(password.matches(".*[0-9].*"));
            assertTrue(password.matches(".*[!@#$%^&*].*"));
        }
    }
}
