package com.shop.backend.controller;

import com.shop.dto.success.SuccessStoryDTO;
import com.shop.dto.success.SuccessStoryRequest;
import com.shop.backend.model.SuccessStory;
import com.shop.backend.service.SuccessStoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/success-stories")
@CrossOrigin(origins = "*")
public class SuccessStoryController {
    
    @Autowired
    private SuccessStoryService successStoryService;
    
    @GetMapping
    public ResponseEntity<Page<SuccessStoryDTO>> getAllStories(
            @RequestParam(required = false) SuccessStory.StoryCategory category,
            @RequestParam(required = false) Boolean featured,
            Pageable pageable,
            Authentication authentication) {
        String userEmail = authentication != null ? authentication.getName() : null;
        
        Page<SuccessStoryDTO> stories;
        if (Boolean.TRUE.equals(featured)) {
            stories = successStoryService.getFeaturedStories(pageable, userEmail);
        } else if (category != null) {
            stories = successStoryService.getStoriesByCategory(category, pageable, userEmail);
        } else {
            stories = successStoryService.getAllStories(pageable, userEmail);
        }
        
        return ResponseEntity.ok(stories);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SuccessStoryDTO> getStoryById(
            @PathVariable Long id,
            Authentication authentication) {
        String userEmail = authentication != null ? authentication.getName() : null;
        SuccessStoryDTO story = successStoryService.getStoryById(id, userEmail);
        
        if (story != null) {
            return ResponseEntity.ok(story);
        }
        return ResponseEntity.notFound().build();
    }
    
    @PostMapping
    public ResponseEntity<SuccessStoryDTO> createStory(
            @RequestBody SuccessStoryRequest request,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        
        String userEmail = authentication.getName();
        try {
            SuccessStoryDTO story = successStoryService.createStory(request, userEmail);
            return ResponseEntity.ok(story);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/{id}/like")
    public ResponseEntity<Void> toggleLikeStory(
            @PathVariable Long id,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        
        String userEmail = authentication.getName();
        successStoryService.toggleLikeStory(id, userEmail);
        return ResponseEntity.ok().build();
    }
    
    // Admin endpoints
    @GetMapping("/admin/pending")
    public ResponseEntity<Page<SuccessStoryDTO>> getPendingStories(Pageable pageable) {
        Page<SuccessStoryDTO> stories = successStoryService.getPendingStories(pageable);
        return ResponseEntity.ok(stories);
    }
    
    @PostMapping("/admin/{id}/approve")
    public ResponseEntity<SuccessStoryDTO> approveStory(@PathVariable Long id) {
        SuccessStoryDTO story = successStoryService.approveStory(id);
        return ResponseEntity.ok(story);
    }
}

