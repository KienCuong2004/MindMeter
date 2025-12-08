package com.shop.backend.controller;

import com.shop.dto.peer.PeerMatchDTO;
import com.shop.dto.peer.PeerMatchPreferencesRequest;
import com.shop.backend.model.PeerMatch;
import com.shop.backend.model.PeerMatchPreferences;
import com.shop.backend.service.PeerMatchingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/peer-matching")
@CrossOrigin(origins = "*")
public class PeerMatchingController {
    
    @Autowired
    private PeerMatchingService peerMatchingService;
    
    @GetMapping("/users/{userId}/matches")
    public ResponseEntity<Page<PeerMatchDTO>> getUserMatches(
            @PathVariable Long userId,
            @RequestParam(required = false) PeerMatch.MatchStatus status,
            Pageable pageable) {
        PeerMatch.MatchStatus matchStatus = status != null ? status : PeerMatch.MatchStatus.PENDING;
        Page<PeerMatchDTO> matches = peerMatchingService.getUserMatches(userId, matchStatus, pageable);
        return ResponseEntity.ok(matches);
    }
    
    @GetMapping("/users/{userId}/matches/active")
    public ResponseEntity<List<PeerMatchDTO>> getActiveMatches(@PathVariable Long userId) {
        List<PeerMatchDTO> matches = peerMatchingService.getActiveMatches(userId);
        return ResponseEntity.ok(matches);
    }
    
    @GetMapping("/users/{userId}/matches/pending")
    public ResponseEntity<List<PeerMatchDTO>> getPendingMatches(@PathVariable Long userId) {
        List<PeerMatchDTO> matches = peerMatchingService.getPendingMatches(userId);
        return ResponseEntity.ok(matches);
    }
    
    @GetMapping("/users/{userId}/preferences")
    public ResponseEntity<PeerMatchPreferences> getPreferences(@PathVariable Long userId) {
        PeerMatchPreferences preferences = peerMatchingService.getPreferences(userId);
        if (preferences != null) {
            return ResponseEntity.ok(preferences);
        }
        return ResponseEntity.notFound().build();
    }
    
    @PutMapping("/users/{userId}/preferences")
    public ResponseEntity<PeerMatchPreferences> savePreferences(
            @PathVariable Long userId,
            @RequestBody PeerMatchPreferencesRequest request,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        
        try {
            PeerMatchPreferences preferences = peerMatchingService.savePreferences(userId, request);
            return ResponseEntity.ok(preferences);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/matches")
    public ResponseEntity<PeerMatchDTO> createMatch(
            @RequestParam Long user1Id,
            @RequestParam Long user2Id,
            @RequestParam(required = false) PeerMatch.MatchType matchType,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        
        String userEmail = authentication.getName();
        PeerMatch.MatchType type = matchType != null ? matchType : PeerMatch.MatchType.MANUAL;
        
        try {
            PeerMatchDTO match = peerMatchingService.createMatch(user1Id, user2Id, type, userEmail);
            return ResponseEntity.ok(match);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/matches/{id}/accept")
    public ResponseEntity<PeerMatchDTO> acceptMatch(
            @PathVariable Long id,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        
        String userEmail = authentication.getName();
        try {
            PeerMatchDTO match = peerMatchingService.acceptMatch(id, userEmail);
            return ResponseEntity.ok(match);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/matches/{id}/reject")
    public ResponseEntity<PeerMatchDTO> rejectMatch(
            @PathVariable Long id,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        
        String userEmail = authentication.getName();
        try {
            PeerMatchDTO match = peerMatchingService.rejectMatch(id, userEmail);
            return ResponseEntity.ok(match);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/matches/{id}/end")
    public ResponseEntity<PeerMatchDTO> endMatch(
            @PathVariable Long id,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        
        String userEmail = authentication.getName();
        try {
            PeerMatchDTO match = peerMatchingService.endMatch(id, userEmail);
            return ResponseEntity.ok(match);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/users/{userId}/potential-matches")
    public ResponseEntity<List<PeerMatchDTO>> findPotentialMatches(
            @PathVariable Long userId,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        
        List<PeerMatchDTO> matches = peerMatchingService.findPotentialMatches(userId);
        return ResponseEntity.ok(matches);
    }
}

