package com.shop.backend.service;

import com.shop.backend.model.User;
import com.shop.backend.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user;
        
        // Kiểm tra nếu là user ẩn danh (username bắt đầu bằng "anonymous_")
        if (username.startsWith("anonymous_")) {
            try {
                Long userId = Long.parseLong(username.substring("anonymous_".length()));
                user = userRepository.findById(userId)
                        .orElseThrow(() -> new UsernameNotFoundException("Anonymous user not found with id: " + userId));
                
                if (!user.isAnonymous()) {
                    throw new UsernameNotFoundException("User is not anonymous: " + userId);
                }
            } catch (NumberFormatException e) {
                throw new UsernameNotFoundException("Invalid anonymous user format: " + username);
            }
        } else {
            // User thường - tìm theo email
            user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));
        }

        String authority = "ROLE_" + user.getRole().name();
        
        return new org.springframework.security.core.userdetails.User(
                username, // Sử dụng username gốc (email hoặc anonymous_id)
                user.getPassword() != null ? user.getPassword() : "", // Password rỗng cho user ẩn danh
                Collections.singletonList(new SimpleGrantedAuthority(authority))
        );
    }
} 