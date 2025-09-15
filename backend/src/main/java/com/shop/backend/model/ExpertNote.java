package com.shop.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "expert_notes")
public class ExpertNote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expert_id", nullable = false)
    private User expert;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_result_id")
    private DepressionTestResult testResult;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(name = "note_type")
    private NoteType noteType = NoteType.GENERAL;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public enum NoteType {
        ADVICE,
        RECOMMENDATION,
        WARNING,
        GENERAL
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
} 