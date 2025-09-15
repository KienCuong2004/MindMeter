package com.shop.backend.dto;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Data
public class UserDTO {
    @JsonIgnore
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String role;
    @JsonIgnore
    private String status;
    private String avatarUrl;
    @JsonIgnore
    private LocalDateTime createdAt;
    @JsonIgnore
    private LocalDateTime updatedAt;
    private String plan;
    private LocalDateTime planStartDate;
    private LocalDateTime planExpiryDate;
} 