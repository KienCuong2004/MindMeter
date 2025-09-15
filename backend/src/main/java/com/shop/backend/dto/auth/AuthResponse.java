package com.shop.backend.dto.auth;

import com.shop.backend.model.Role;
import com.shop.backend.dto.UserDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String email;
    private Role role;
    private UserDTO user; // Sử dụng UserDTO thay vì User entity
    private boolean requiresPasswordChange = false;
    private String message;
} 