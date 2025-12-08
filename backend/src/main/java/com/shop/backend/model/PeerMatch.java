package com.shop.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "peer_matches")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PeerMatch {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user1_id", nullable = false)
    private User user1;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user2_id", nullable = false)
    private User user2;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "match_type", nullable = false)
    private MatchType matchType = MatchType.AUTO;
    
    @Column(name = "match_score", precision = 5, scale = 2)
    private BigDecimal matchScore = BigDecimal.ZERO;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MatchStatus status = MatchStatus.PENDING;
    
    @CreationTimestamp
    @Column(name = "matched_at", updatable = false)
    private LocalDateTime matchedAt;
    
    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;
    
    @Column(name = "ended_at")
    private LocalDateTime endedAt;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    public enum MatchType {
        AUTO, MANUAL, REQUESTED
    }
    
    public enum MatchStatus {
        PENDING, ACCEPTED, REJECTED, ACTIVE, ENDED
    }
}

