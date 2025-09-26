package com.shop.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "depression_test_results")
public class DepressionTestResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "total_score", nullable = false)
    private Integer totalScore;

    @Column(nullable = false, length = 1000)
    private String diagnosis;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity_level", nullable = false)
    private SeverityLevel severityLevel;

    @Column(name = "tested_at")
    private LocalDateTime testedAt;

    @Column(name = "recommendation", length = 2000)
    private String recommendation;

    @Column(name = "test_type", length = 50)
    private String testType;

    @Convert(converter = com.shop.backend.converter.LanguageConverter.class)
    @Column(name = "language", nullable = false)
    private Language language = Language.VI;

    @OneToMany(mappedBy = "testResult", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DepressionTestAnswer> answers;

    public enum Language {
        VI("vi"), EN("en");
        
        private final String value;
        
        Language(String value) {
            this.value = value;
        }
        
        public String getValue() {
            return value;
        }
        
        public static Language fromString(String text) {
            if (text == null) return VI;
            for (Language language : Language.values()) {
                if (language.value.equalsIgnoreCase(text) || language.name().equalsIgnoreCase(text)) {
                    return language;
                }
            }
            return VI; // Default fallback
        }
    }

    public enum SeverityLevel {
        MINIMAL,
        MILD,
        MODERATE,
        SEVERE
    }

    @PrePersist
    protected void onCreate() {
        testedAt = LocalDateTime.now();
    }
} 