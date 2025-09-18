package com.shop.backend.service;

import com.shop.backend.dto.auth.LoginRequest;
import com.shop.backend.dto.auth.RegisterRequest;
import com.shop.backend.dto.auth.AuthResponse;
import com.shop.backend.dto.UserDTO;
import com.shop.backend.model.User;
import com.shop.backend.model.Role;
import com.shop.backend.repository.UserRepository;
import com.shop.backend.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private OtpService otpService;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private LoginRequest loginRequest;
    private RegisterRequest registerRequest;
    private AuthResponse authResponse;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setPassword("encodedPassword");
        testUser.setFirstName("John");
        testUser.setLastName("Doe");
        testUser.setRole(Role.STUDENT);
        testUser.setStatus(User.Status.ACTIVE);

        loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("password123");

        registerRequest = new RegisterRequest();
        registerRequest.setEmail("newuser@example.com");
        registerRequest.setPassword("password123");

        // Create mock AuthResponse
        UserDTO userDTO = new UserDTO();
        userDTO.setId(1L);
        userDTO.setEmail("test@example.com");
        userDTO.setFirstName("John");
        userDTO.setLastName("Doe");
        userDTO.setRole("STUDENT");
        
        authResponse = new AuthResponse();
        authResponse.setToken("mock-jwt-token");
        authResponse.setEmail("test@example.com");
        authResponse.setRole(Role.STUDENT);
        authResponse.setUser(userDTO);
    }

    @Test
    void login_WithValidCredentials_ShouldReturnToken() {
        // Given
        when(authenticationManager.authenticate(any())).thenReturn(null); // Mock successful authentication
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(jwtService.generateTokenWithUserInfo(testUser)).thenReturn("mock-jwt-token");

        // When
        AuthResponse result = authService.login(loginRequest);

        // Then
        assertNotNull(result);
        assertEquals("mock-jwt-token", result.getToken());
        assertEquals("test@example.com", result.getEmail());
        assertEquals(Role.STUDENT, result.getRole());
        verify(authenticationManager).authenticate(any());
        verify(userRepository).findByEmail("test@example.com");
        verify(jwtService).generateTokenWithUserInfo(testUser);
    }

    @Test
    void login_WithInvalidEmail_ShouldThrowException() {
        // Given
        when(authenticationManager.authenticate(any())).thenReturn(null); // Mock successful authentication
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () -> authService.login(loginRequest));
        verify(authenticationManager).authenticate(any());
        verify(userRepository).findByEmail("test@example.com");
        verifyNoInteractions(jwtService);
    }

    @Test
    void login_WithInvalidPassword_ShouldThrowException() {
        // Given
        when(authenticationManager.authenticate(any())).thenThrow(new RuntimeException("Invalid credentials"));

        // When & Then
        assertThrows(RuntimeException.class, () -> authService.login(loginRequest));
        verify(authenticationManager).authenticate(any());
        verifyNoInteractions(userRepository);
        verifyNoInteractions(jwtService);
    }

    @Test
    void register_WithValidData_ShouldCreateUser() {
        // Given
        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(jwtService.generateToken(any(), any())).thenReturn("mock-jwt-token");

        // When
        AuthResponse result = authService.register(registerRequest);

        // Then
        assertNotNull(result);
        assertEquals("mock-jwt-token", result.getToken());
        assertEquals("newuser@example.com", result.getEmail());
        assertEquals(Role.STUDENT, result.getRole());
        verify(userRepository).existsByEmail("newuser@example.com");
        verify(passwordEncoder).encode("password123");
        verify(userRepository).save(any(User.class));
        verify(jwtService).generateToken(any(), any());
    }

    @Test
    void register_WithExistingEmail_ShouldThrowException() {
        // Given
        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(true);

        // When & Then
        assertThrows(RuntimeException.class, () -> authService.register(registerRequest));
        verify(userRepository).existsByEmail("newuser@example.com");
        verifyNoInteractions(passwordEncoder);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void register_WithNullEmail_ShouldThrowException() {
        // Given
        registerRequest.setEmail(null);

        // When & Then
        // AuthService không validate null email, nó sẽ gọi existsByEmail(null) và có thể throw exception
        assertThrows(Exception.class, () -> authService.register(registerRequest));
        verify(userRepository).existsByEmail(null);
    }

    @Test
    void register_WithEmptyPassword_ShouldCreateUser() {
        // Given
        registerRequest.setPassword("");
        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(false);
        when(passwordEncoder.encode("")).thenReturn("encodedEmptyPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(jwtService.generateToken(any(), any())).thenReturn("mock-jwt-token");

        // When
        AuthResponse result = authService.register(registerRequest);

        // Then
        assertNotNull(result);
        assertEquals("mock-jwt-token", result.getToken());
        assertEquals("newuser@example.com", result.getEmail());
        assertEquals(Role.STUDENT, result.getRole());
        verify(userRepository).existsByEmail("newuser@example.com");
        verify(passwordEncoder).encode("");
        verify(userRepository).save(any(User.class));
        verify(jwtService).generateToken(any(), any());
    }
}
