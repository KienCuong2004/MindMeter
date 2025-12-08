package com.shop.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "peer_match_preferences")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PeerMatchPreferences {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    
    @Column(name = "age_range_min")
    private Integer ageRangeMin = 18;
    
    @Column(name = "age_range_max")
    private Integer ageRangeMax = 30;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_gender")
    private PreferredGender preferredGender = PreferredGender.ANY;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_language")
    private PreferredLanguage preferredLanguage = PreferredLanguage.both;
    
    @Column(columnDefinition = "TEXT")
    private String interests;
    
    @Column(name = "matching_enabled", nullable = false)
    private Boolean matchingEnabled = true;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum PreferredGender {
        MALE, FEMALE, OTHER, ANY
    }
    
    public enum PreferredLanguage {
        vi, en, both
    }
}

