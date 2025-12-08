package com.shop.backend.service;

import com.shop.dto.peer.PeerMatchDTO;
import com.shop.dto.peer.PeerMatchPreferencesRequest;
import com.shop.backend.model.*;
import com.shop.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
public class PeerMatchingService {
    
    @Autowired
    private PeerMatchRepository peerMatchRepository;
    
    @Autowired
    private PeerMatchPreferencesRepository peerMatchPreferencesRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    public Page<PeerMatchDTO> getUserMatches(Long userId, PeerMatch.MatchStatus status, Pageable pageable) {
        Page<PeerMatch> matches;
        if (status != null) {
            matches = peerMatchRepository.findMatchesByUserId(userId, status, pageable);
        } else {
            matches = peerMatchRepository.findAllMatchesByUserId(userId, pageable);
        }
        return matches.map(this::convertToDTO);
    }
    
    public List<PeerMatchDTO> getActiveMatches(Long userId) {
        List<PeerMatch> matches = peerMatchRepository.findActiveMatchesByUserId(userId);
        return matches.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    
    public List<PeerMatchDTO> getPendingMatches(Long userId) {
        List<PeerMatch> matches = peerMatchRepository.findPendingMatchesByUserId(userId);
        return matches.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    
    public PeerMatchPreferences getPreferences(Long userId) {
        return peerMatchPreferencesRepository.findByUserId(userId)
            .orElse(null);
    }
    
    public PeerMatchPreferences savePreferences(Long userId, PeerMatchPreferencesRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        PeerMatchPreferences preferences = peerMatchPreferencesRepository.findByUserId(userId)
            .orElse(new PeerMatchPreferences());
        
        preferences.setUser(user);
        
        if (request.getAgeRangeMin() != null) {
            preferences.setAgeRangeMin(request.getAgeRangeMin());
        }
        if (request.getAgeRangeMax() != null) {
            preferences.setAgeRangeMax(request.getAgeRangeMax());
        }
        if (request.getPreferredGender() != null) {
            preferences.setPreferredGender(request.getPreferredGender());
        }
        if (request.getPreferredLanguage() != null) {
            preferences.setPreferredLanguage(request.getPreferredLanguage());
        }
        if (request.getInterests() != null) {
            preferences.setInterests(request.getInterests());
        }
        if (request.getMatchingEnabled() != null) {
            preferences.setMatchingEnabled(request.getMatchingEnabled());
        }
        
        return peerMatchPreferencesRepository.save(preferences);
    }
    
    public PeerMatchDTO createMatch(Long user1Id, Long user2Id, PeerMatch.MatchType matchType, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Verify user is one of the participants
        if (!user.getId().equals(user1Id) && !user.getId().equals(user2Id)) {
            throw new RuntimeException("Unauthorized to create this match");
        }
        
        if (user1Id.equals(user2Id)) {
            throw new RuntimeException("Cannot match user with themselves");
        }
        
        // Check if match already exists
        Optional<PeerMatch> existingMatch = peerMatchRepository.findExistingMatch(user1Id, user2Id);
        if (existingMatch.isPresent()) {
            throw new RuntimeException("Match already exists between these users");
        }
        
        User user1 = userRepository.findById(user1Id)
            .orElseThrow(() -> new RuntimeException("User 1 not found"));
        User user2 = userRepository.findById(user2Id)
            .orElseThrow(() -> new RuntimeException("User 2 not found"));
        
        // Calculate match score (simplified - can be enhanced with more sophisticated algorithm)
        BigDecimal matchScore = calculateMatchScore(user1, user2);
        
        PeerMatch match = new PeerMatch();
        match.setUser1(user1);
        match.setUser2(user2);
        match.setMatchType(matchType);
        match.setMatchScore(matchScore);
        match.setStatus(PeerMatch.MatchStatus.PENDING);
        
        match = peerMatchRepository.save(match);
        return convertToDTO(match);
    }
    
    public PeerMatchDTO acceptMatch(Long matchId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        PeerMatch match = peerMatchRepository.findById(matchId)
            .orElseThrow(() -> new RuntimeException("Match not found"));
        
        // Verify user is part of this match
        if (!match.getUser1().getId().equals(user.getId()) && !match.getUser2().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to accept this match");
        }
        
        if (match.getStatus() != PeerMatch.MatchStatus.PENDING) {
            throw new RuntimeException("Match is not in pending status");
        }
        
        match.setStatus(PeerMatch.MatchStatus.ACCEPTED);
        match.setAcceptedAt(LocalDateTime.now());
        
        // If both users have accepted, set to ACTIVE
        // For simplicity, we'll set to ACTIVE when one accepts (can be enhanced)
        match.setStatus(PeerMatch.MatchStatus.ACTIVE);
        
        match = peerMatchRepository.save(match);
        return convertToDTO(match);
    }
    
    public PeerMatchDTO rejectMatch(Long matchId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        PeerMatch match = peerMatchRepository.findById(matchId)
            .orElseThrow(() -> new RuntimeException("Match not found"));
        
        // Verify user is part of this match
        if (!match.getUser1().getId().equals(user.getId()) && !match.getUser2().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to reject this match");
        }
        
        if (match.getStatus() != PeerMatch.MatchStatus.PENDING) {
            throw new RuntimeException("Match is not in pending status");
        }
        
        match.setStatus(PeerMatch.MatchStatus.REJECTED);
        match = peerMatchRepository.save(match);
        return convertToDTO(match);
    }
    
    public PeerMatchDTO endMatch(Long matchId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        PeerMatch match = peerMatchRepository.findById(matchId)
            .orElseThrow(() -> new RuntimeException("Match not found"));
        
        // Verify user is part of this match
        if (!match.getUser1().getId().equals(user.getId()) && !match.getUser2().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to end this match");
        }
        
        if (match.getStatus() != PeerMatch.MatchStatus.ACTIVE) {
            throw new RuntimeException("Only active matches can be ended");
        }
        
        match.setStatus(PeerMatch.MatchStatus.ENDED);
        match.setEndedAt(LocalDateTime.now());
        match = peerMatchRepository.save(match);
        return convertToDTO(match);
    }
    
    public List<PeerMatchDTO> findPotentialMatches(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        PeerMatchPreferences preferences = peerMatchPreferencesRepository.findByUserId(userId)
            .orElse(new PeerMatchPreferences());
        
        if (!preferences.getMatchingEnabled()) {
            return List.of();
        }
        
        // Find users with matching enabled
        List<PeerMatchPreferences> allPreferences = peerMatchPreferencesRepository.findByMatchingEnabledTrue();
        
        return allPreferences.stream()
            .filter(pref -> !pref.getUser().getId().equals(userId))
            .filter(pref -> {
                // Check if already matched
                Optional<PeerMatch> existing = peerMatchRepository.findExistingMatch(userId, pref.getUser().getId());
                return existing.isEmpty();
            })
            .map(pref -> {
                // Create potential match DTO (not saved yet)
                PeerMatch potentialMatch = new PeerMatch();
                potentialMatch.setUser1(user);
                potentialMatch.setUser2(pref.getUser());
                potentialMatch.setMatchScore(calculateMatchScore(user, pref.getUser()));
                return convertToDTO(potentialMatch);
            })
            .sorted((a, b) -> b.getMatchScore().compareTo(a.getMatchScore()))
            .limit(10)
            .collect(Collectors.toList());
    }
    
    // Helper methods
    private PeerMatchDTO convertToDTO(PeerMatch match) {
        PeerMatchDTO dto = new PeerMatchDTO();
        dto.setId(match.getId());
        
        try {
            User user1 = match.getUser1();
            if (user1 != null) {
                dto.setUser1Id(user1.getId());
                String firstName1 = user1.getFirstName() != null ? user1.getFirstName() : "";
                String lastName1 = user1.getLastName() != null ? user1.getLastName() : "";
                String fullName1 = (firstName1 + " " + lastName1).trim();
                if (fullName1.isEmpty()) {
                    fullName1 = user1.getEmail() != null ? user1.getEmail() : "Unknown User";
                }
                dto.setUser1Name(fullName1);
                dto.setUser1Avatar(user1.getAvatarUrl());
            } else {
                dto.setUser1Id(null);
                dto.setUser1Name("Unknown User");
                dto.setUser1Avatar(null);
            }
        } catch (Exception e) {
            log.error("Error converting user1 in match to DTO: {}", e.getMessage());
            dto.setUser1Id(null);
            dto.setUser1Name("Unknown User");
            dto.setUser1Avatar(null);
        }
        
        try {
            User user2 = match.getUser2();
            if (user2 != null) {
                dto.setUser2Id(user2.getId());
                String firstName2 = user2.getFirstName() != null ? user2.getFirstName() : "";
                String lastName2 = user2.getLastName() != null ? user2.getLastName() : "";
                String fullName2 = (firstName2 + " " + lastName2).trim();
                if (fullName2.isEmpty()) {
                    fullName2 = user2.getEmail() != null ? user2.getEmail() : "Unknown User";
                }
                dto.setUser2Name(fullName2);
                dto.setUser2Avatar(user2.getAvatarUrl());
            } else {
                dto.setUser2Id(null);
                dto.setUser2Name("Unknown User");
                dto.setUser2Avatar(null);
            }
        } catch (Exception e) {
            log.error("Error converting user2 in match to DTO: {}", e.getMessage());
            dto.setUser2Id(null);
            dto.setUser2Name("Unknown User");
            dto.setUser2Avatar(null);
        }
        dto.setMatchType(match.getMatchType());
        dto.setMatchScore(match.getMatchScore());
        dto.setStatus(match.getStatus());
        dto.setMatchedAt(match.getMatchedAt());
        dto.setAcceptedAt(match.getAcceptedAt());
        dto.setNotes(match.getNotes());
        return dto;
    }
    
    private BigDecimal calculateMatchScore(User user1, User user2) {
        // Simplified matching algorithm
        // Can be enhanced with more sophisticated logic based on:
        // - Test results similarity
        // - Interests matching
        // - Age compatibility
        // - Language preferences
        // etc.
        
        BigDecimal score = BigDecimal.valueOf(50.0); // Base score
        
        // Age compatibility (if available)
        // Add more logic here based on your requirements
        
        // Language compatibility
        // Add more logic here
        
        // Interests matching
        // Add more logic here
        
        return score;
    }
}

