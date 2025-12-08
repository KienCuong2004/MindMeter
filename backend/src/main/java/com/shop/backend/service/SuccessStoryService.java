package com.shop.backend.service;

import com.shop.dto.success.SuccessStoryDTO;
import com.shop.dto.success.SuccessStoryRequest;
import com.shop.backend.model.*;
import com.shop.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@Transactional
public class SuccessStoryService {
    
    @Autowired
    private SuccessStoryRepository successStoryRepository;
    
    @Autowired
    private SuccessStoryLikeRepository successStoryLikeRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ContentModerationService contentModerationService;
    
    public Page<SuccessStoryDTO> getAllStories(Pageable pageable, String userEmail) {
        Page<SuccessStory> stories = successStoryRepository.findByIsApprovedTrueOrderByPublishedAtDesc(pageable);
        return stories.map(story -> convertToDTO(story, userEmail));
    }
    
    public Page<SuccessStoryDTO> getFeaturedStories(Pageable pageable, String userEmail) {
        Page<SuccessStory> stories = successStoryRepository.findByIsFeaturedTrueAndIsApprovedTrueOrderByPublishedAtDesc(pageable);
        return stories.map(story -> convertToDTO(story, userEmail));
    }
    
    public Page<SuccessStoryDTO> getStoriesByCategory(SuccessStory.StoryCategory category, Pageable pageable, String userEmail) {
        Page<SuccessStory> stories = successStoryRepository.findByCategoryAndIsApprovedTrueOrderByPublishedAtDesc(category, pageable);
        return stories.map(story -> convertToDTO(story, userEmail));
    }
    
    public SuccessStoryDTO getStoryById(Long id, String userEmail) {
        Optional<SuccessStory> story = successStoryRepository.findByIdAndIsApprovedTrue(id);
        if (story.isPresent()) {
            SuccessStory s = story.get();
            s.setViewCount(s.getViewCount() + 1);
            successStoryRepository.save(s);
            return convertToDTO(s, userEmail);
        }
        return null;
    }
    
    public SuccessStoryDTO createStory(SuccessStoryRequest request, String authorEmail) {
        User author = userRepository.findByEmail(authorEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Content moderation
        ContentModerationService.ModerationResult moderationResult = 
            contentModerationService.checkContent(request.getContent());
        if (moderationResult.isFlagged()) {
            throw new RuntimeException("Content contains inappropriate language: " + moderationResult.getReason());
        }
        
        SuccessStory story = new SuccessStory();
        story.setTitle(request.getTitle());
        story.setContent(request.getContent());
        story.setAuthor(author);
        story.setCategory(request.getCategory() != null ? request.getCategory() : SuccessStory.StoryCategory.RECOVERY);
        story.setTags(request.getTags());
        story.setIsAnonymous(request.getIsAnonymous() != null ? request.getIsAnonymous() : false);
        story.setIsApproved(false); // Requires admin approval
        story.setIsFeatured(false);
        
        story = successStoryRepository.save(story);
        return convertToDTO(story, authorEmail);
    }
    
    public void toggleLikeStory(Long storyId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Optional<SuccessStoryLike> existingLike = successStoryLikeRepository.findByStoryIdAndUserId(storyId, user.getId());
        
        if (existingLike.isPresent()) {
            successStoryLikeRepository.delete(existingLike.get());
            updateStoryLikeCount(storyId);
        } else {
            SuccessStoryLike like = new SuccessStoryLike();
            like.setStory(successStoryRepository.findById(storyId).orElseThrow());
            like.setUser(user);
            successStoryLikeRepository.save(like);
            updateStoryLikeCount(storyId);
        }
    }
    
    // Admin methods
    public Page<SuccessStoryDTO> getPendingStories(Pageable pageable) {
        Page<SuccessStory> stories = successStoryRepository.findByIsApprovedFalseOrderByCreatedAtDesc(pageable);
        return stories.map(story -> convertToDTO(story, null));
    }
    
    public SuccessStoryDTO approveStory(Long id) {
        SuccessStory story = successStoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Story not found"));
        
        story.setIsApproved(true);
        story.setPublishedAt(LocalDateTime.now());
        story = successStoryRepository.save(story);
        
        return convertToDTO(story, null);
    }
    
    private SuccessStoryDTO convertToDTO(SuccessStory story, String userEmail) {
        SuccessStoryDTO dto = new SuccessStoryDTO();
        dto.setId(story.getId());
        dto.setTitle(story.getTitle());
        dto.setContent(story.getContent());
        
        try {
            User author = story.getAuthor();
            if (author != null) {
                dto.setAuthorId(author.getId());
                
                if (story.getIsAnonymous()) {
                    dto.setAuthorName("Anonymous");
                    dto.setAuthorAvatar(null);
                } else {
                    String firstName = author.getFirstName() != null ? author.getFirstName() : "";
                    String lastName = author.getLastName() != null ? author.getLastName() : "";
                    String fullName = (firstName + " " + lastName).trim();
                    if (fullName.isEmpty()) {
                        fullName = author.getEmail() != null ? author.getEmail() : "Unknown User";
                    }
                    dto.setAuthorName(fullName);
                    dto.setAuthorAvatar(author.getAvatarUrl());
                }
            } else {
                dto.setAuthorId(null);
                dto.setAuthorName("Unknown User");
                dto.setAuthorAvatar(null);
            }
        } catch (Exception e) {
            log.error("Error converting story to DTO: {}", e.getMessage());
            dto.setAuthorId(null);
            dto.setAuthorName("Unknown User");
            dto.setAuthorAvatar(null);
        }
        
        dto.setIsAnonymous(story.getIsAnonymous());
        dto.setIsFeatured(story.getIsFeatured());
        dto.setIsApproved(story.getIsApproved());
        dto.setViewCount(story.getViewCount());
        dto.setLikeCount(story.getLikeCount());
        dto.setShareCount(story.getShareCount());
        dto.setCategory(story.getCategory());
        dto.setTags(story.getTags());
        dto.setCreatedAt(story.getCreatedAt());
        dto.setPublishedAt(story.getPublishedAt());
        
        // Check if user liked this story
        if (userEmail != null) {
            User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user != null) {
                dto.setIsLiked(successStoryLikeRepository.existsByStoryIdAndUserId(story.getId(), user.getId()));
            }
        }
        
        return dto;
    }
    
    private void updateStoryLikeCount(Long storyId) {
        SuccessStory story = successStoryRepository.findById(storyId).orElseThrow();
        long count = successStoryLikeRepository.countByStoryId(storyId);
        story.setLikeCount((int) count);
        successStoryRepository.save(story);
    }
}

