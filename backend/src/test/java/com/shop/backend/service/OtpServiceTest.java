package com.shop.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class OtpServiceTest {

    @InjectMocks
    private OtpService otpService;

    private final String TEST_EMAIL = "test@example.com";
    private final String TEST_OTP = "123456";

    @BeforeEach
    void setUp() {
        // Reset service state before each test
        otpService = new OtpService();
    }

    @Test
    void saveOtp_ShouldSaveOtp_WhenValidInput() {
        // Given
        int minutes = 5;

        // When
        otpService.saveOtp(TEST_EMAIL, TEST_OTP, minutes);

        // Then
        assertTrue(otpService.verifyOtp(TEST_EMAIL, TEST_OTP));
    }

    @Test
    void verifyOtp_ShouldReturnTrue_WhenValidOtp() {
        // Given
        otpService.saveOtp(TEST_EMAIL, TEST_OTP, 5);

        // When
        boolean result = otpService.verifyOtp(TEST_EMAIL, TEST_OTP);

        // Then
        assertTrue(result);
    }

    @Test
    void verifyOtp_ShouldReturnFalse_WhenInvalidOtp() {
        // Given
        otpService.saveOtp(TEST_EMAIL, TEST_OTP, 5);

        // When
        boolean result = otpService.verifyOtp(TEST_EMAIL, "wrong_otp");

        // Then
        assertFalse(result);
    }

    @Test
    void verifyOtp_ShouldReturnFalse_WhenEmailNotFound() {
        // When
        boolean result = otpService.verifyOtp("nonexistent@example.com", TEST_OTP);

        // Then
        assertFalse(result);
    }

    @Test
    void verifyOtp_ShouldReturnFalse_WhenOtpExpired() {
        // Given
        otpService.saveOtp(TEST_EMAIL, TEST_OTP, -1); // Expired immediately

        // When
        boolean result = otpService.verifyOtp(TEST_EMAIL, TEST_OTP);

        // Then
        assertFalse(result);
    }

    @Test
    void verifyOtp_ShouldRemoveOtp_AfterSuccessfulVerification() {
        // Given
        otpService.saveOtp(TEST_EMAIL, TEST_OTP, 5);

        // When
        boolean firstVerification = otpService.verifyOtp(TEST_EMAIL, TEST_OTP);
        boolean secondVerification = otpService.verifyOtp(TEST_EMAIL, TEST_OTP);

        // Then
        assertTrue(firstVerification);
        assertFalse(secondVerification); // Should be removed after first verification
    }

    @Test
    void verifyOtp_ShouldRemoveOtp_WhenExpired() {
        // Given
        otpService.saveOtp(TEST_EMAIL, TEST_OTP, -1); // Expired immediately

        // When
        boolean result = otpService.verifyOtp(TEST_EMAIL, TEST_OTP);

        // Then
        assertFalse(result);
        // OTP should be removed from store
        assertFalse(otpService.verifyOtp(TEST_EMAIL, TEST_OTP));
    }

    @Test
    void saveOtp_ShouldOverwriteExistingOtp_WhenSameEmail() {
        // Given
        String firstOtp = "111111";
        String secondOtp = "222222";
        otpService.saveOtp(TEST_EMAIL, firstOtp, 5);

        // When
        otpService.saveOtp(TEST_EMAIL, secondOtp, 5);

        // Then
        assertFalse(otpService.verifyOtp(TEST_EMAIL, firstOtp));
        assertTrue(otpService.verifyOtp(TEST_EMAIL, secondOtp));
    }

    @Test
    void saveOtp_ShouldHandleNullEmail() {
        // When & Then
        assertDoesNotThrow(() -> otpService.saveOtp(null, TEST_OTP, 5));
    }

    @Test
    void saveOtp_ShouldHandleNullOtp() {
        // When & Then
        assertDoesNotThrow(() -> otpService.saveOtp(TEST_EMAIL, null, 5));
    }

    @Test
    void verifyOtp_ShouldHandleNullEmail() {
        // When
        boolean result = otpService.verifyOtp(null, TEST_OTP);

        // Then
        assertFalse(result);
    }

    @Test
    void verifyOtp_ShouldHandleNullOtp() {
        // Given
        otpService.saveOtp(TEST_EMAIL, TEST_OTP, 5);

        // When
        boolean result = otpService.verifyOtp(TEST_EMAIL, null);

        // Then
        assertFalse(result);
    }

    @Test
    void saveOtp_ShouldHandleZeroMinutes() {
        // Given
        int minutes = 0;

        // When
        otpService.saveOtp(TEST_EMAIL, TEST_OTP, minutes);

        // Then
        // OTP should be valid immediately but expire very soon
        assertTrue(otpService.verifyOtp(TEST_EMAIL, TEST_OTP));
    }

    @Test
    void saveOtp_ShouldHandleNegativeMinutes() {
        // Given
        int minutes = -5;

        // When
        otpService.saveOtp(TEST_EMAIL, TEST_OTP, minutes);

        // Then
        // OTP should be expired immediately
        assertFalse(otpService.verifyOtp(TEST_EMAIL, TEST_OTP));
    }
}
