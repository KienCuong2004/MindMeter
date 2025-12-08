package com.shop.dto.peer;

import com.shop.backend.model.PeerMatch;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PeerMatchDTO {
    private Long id;
    private Long user1Id;
    private String user1Name;
    private String user1Avatar;
    private Long user2Id;
    private String user2Name;
    private String user2Avatar;
    private PeerMatch.MatchType matchType;
    private BigDecimal matchScore;
    private PeerMatch.MatchStatus status;
    private LocalDateTime matchedAt;
    private LocalDateTime acceptedAt;
    private String notes;
}

