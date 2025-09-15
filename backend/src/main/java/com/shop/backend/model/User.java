package com.shop.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String email;

    @JsonIgnore
    @Column
    private String password;

    @Column(nullable = false, name = "first_name")
    private String firstName;

    @Column(nullable = false, name = "last_name")
    private String lastName;

    private String phone;
    
    @Column(name = "avatar_url")
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.ACTIVE;

    @Column(nullable = false)
    private boolean anonymous = false;

    @Column(nullable = false)
    private String plan = "FREE";

    @Column(name = "plan_start_date")
    private LocalDateTime planStartDate;

    @Column(name = "plan_expiry_date")
    private LocalDateTime planExpiryDate;

    @Column(name = "oauth_provider")
    private String oauthProvider;

    @Column(name = "is_temp_password")
    private boolean isTemporaryPassword = false;

    @Column(name = "temp_password_used")
    private boolean tempPasswordUsed = false;

    @Column(name = "created_at")
    @JsonIgnore
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @JsonIgnore
    private LocalDateTime updatedAt;

    public enum Status {
        ACTIVE, INACTIVE, BANNED
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    
    // Thêm method getFullName()
    public String getFullName() {
        return firstName + " " + lastName;
    }
} 