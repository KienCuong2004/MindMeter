package com.shop.backend.service;

import com.shop.dto.forum.ForumPostDTO;
import com.shop.dto.forum.ForumPostRequest;
import com.shop.dto.forum.ForumCommentDTO;
import com.shop.dto.forum.ForumCommentRequest;
import com.shop.backend.model.*;
import com.shop.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
public class ForumService {
    
    @Autowired
    private ForumPostRepository forumPostRepository;
    
    @Autowired
    private ForumCommentRepository forumCommentRepository;
    
    @Autowired
    private ForumPostLikeRepository forumPostLikeRepository;
    
    @Autowired
    private ForumCommentLikeRepository forumCommentLikeRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ContentModerationService contentModerationService;
    
    // Forum Post Methods
    public Page<ForumPostDTO> getAllPosts(Pageable pageable, String userEmail) {
        Page<ForumPost> posts = forumPostRepository.findByStatusOrderByCreatedAtDesc(
            ForumPost.ForumPostStatus.active, pageable);
        return posts.map(post -> convertToPostDTO(post, userEmail));
    }
    
    public Page<ForumPostDTO> getPostsByCategory(ForumPost.ForumCategory category, Pageable pageable, String userEmail) {
        Page<ForumPost> posts = forumPostRepository.findByCategoryAndStatusOrderByCreatedAtDesc(
            category, ForumPost.ForumPostStatus.active, pageable);
        return posts.map(post -> convertToPostDTO(post, userEmail));
    }
    
    public ForumPostDTO getPostById(Long id, String userEmail) {
        Optional<ForumPost> post = forumPostRepository.findByIdAndStatus(id, ForumPost.ForumPostStatus.active);
        if (post.isPresent()) {
            return convertToPostDTO(post.get(), userEmail);
        }
        return null;
    }
    
    public void incrementViewCount(Long id) {
        Optional<ForumPost> post = forumPostRepository.findByIdAndStatus(id, ForumPost.ForumPostStatus.active);
        if (post.isPresent()) {
            ForumPost p = post.get();
            p.setViewCount(p.getViewCount() + 1);
            forumPostRepository.save(p);
        }
    }
    
    public ForumPostDTO createPost(ForumPostRequest request, String authorEmail) {
        User author = userRepository.findByEmail(authorEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Content moderation
        ContentModerationService.ModerationResult moderationResult = 
            contentModerationService.checkContent(request.getContent());
        if (moderationResult.isFlagged()) {
            throw new RuntimeException("Content contains inappropriate language: " + moderationResult.getReason());
        }
        
        ForumPost post = new ForumPost();
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setAuthor(author);
        post.setCategory(request.getCategory() != null ? request.getCategory() : ForumPost.ForumCategory.GENERAL);
        post.setIsAnonymous(request.getIsAnonymous() != null ? request.getIsAnonymous() : false);
        post.setStatus(ForumPost.ForumPostStatus.active);
        
        post = forumPostRepository.save(post);
        return convertToPostDTO(post, authorEmail);
    }
    
    public ForumPostDTO updatePost(Long id, ForumPostRequest request, String userEmail) {
        ForumPost post = forumPostRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!post.getAuthor().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to update this post");
        }
        
        // Content moderation
        ContentModerationService.ModerationResult moderationResult = 
            contentModerationService.checkContent(request.getContent());
        if (moderationResult.isFlagged()) {
            throw new RuntimeException("Content contains inappropriate language: " + moderationResult.getReason());
        }
        
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        if (request.getCategory() != null) {
            post.setCategory(request.getCategory());
        }
        if (request.getIsAnonymous() != null) {
            post.setIsAnonymous(request.getIsAnonymous());
        }
        
        post = forumPostRepository.save(post);
        return convertToPostDTO(post, userEmail);
    }
    
    public void deletePost(Long id, String userEmail) {
        ForumPost post = forumPostRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!post.getAuthor().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to delete this post");
        }
        
        post.setStatus(ForumPost.ForumPostStatus.deleted);
        forumPostRepository.save(post);
    }
    
    public void toggleLikePost(Long postId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Optional<ForumPostLike> existingLike = forumPostLikeRepository.findByPostIdAndUserId(postId, user.getId());
        
        if (existingLike.isPresent()) {
            forumPostLikeRepository.delete(existingLike.get());
            updatePostLikeCount(postId);
        } else {
            ForumPostLike like = new ForumPostLike();
            like.setPost(forumPostRepository.findById(postId).orElseThrow());
            like.setUser(user);
            forumPostLikeRepository.save(like);
            updatePostLikeCount(postId);
        }
    }
    
    // Forum Comment Methods
    public Page<ForumCommentDTO> getCommentsByPost(Long postId, Pageable pageable, String userEmail) {
        Page<ForumComment> comments = forumCommentRepository.findByPostIdAndStatusOrderByCreatedAtAsc(
            postId, ForumComment.ForumCommentStatus.active, pageable);
        return comments.map(comment -> convertToCommentDTO(comment, userEmail));
    }
    
    public ForumCommentDTO createComment(Long postId, ForumCommentRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        ForumPost post = forumPostRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        
        // Content moderation
        ContentModerationService.ModerationResult moderationResult = 
            contentModerationService.checkContent(request.getContent());
        if (moderationResult.isFlagged()) {
            throw new RuntimeException("Content contains inappropriate language: " + moderationResult.getReason());
        }
        
        ForumComment comment = new ForumComment();
        comment.setPost(post);
        comment.setUser(user);
        comment.setContent(request.getContent());
        comment.setIsAnonymous(request.getIsAnonymous() != null ? request.getIsAnonymous() : false);
        comment.setStatus(ForumComment.ForumCommentStatus.active);
        
        if (request.getParentId() != null) {
            ForumComment parent = forumCommentRepository.findById(request.getParentId())
                .orElseThrow(() -> new RuntimeException("Parent comment not found"));
            comment.setParent(parent);
        }
        
        comment = forumCommentRepository.save(comment);
        updatePostCommentCount(postId);
        
        return convertToCommentDTO(comment, userEmail);
    }
    
    public void toggleLikeComment(Long commentId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Optional<ForumCommentLike> existingLike = forumCommentLikeRepository.findByCommentIdAndUserId(commentId, user.getId());
        
        if (existingLike.isPresent()) {
            forumCommentLikeRepository.delete(existingLike.get());
            updateCommentLikeCount(commentId);
        } else {
            ForumCommentLike like = new ForumCommentLike();
            like.setComment(forumCommentRepository.findById(commentId).orElseThrow());
            like.setUser(user);
            forumCommentLikeRepository.save(like);
            updateCommentLikeCount(commentId);
        }
    }
    
    // Helper methods
    private ForumPostDTO convertToPostDTO(ForumPost post, String userEmail) {
        ForumPostDTO dto = new ForumPostDTO();
        dto.setId(post.getId());
        dto.setTitle(post.getTitle());
        dto.setContent(post.getContent());
        
        try {
            User author = post.getAuthor();
            if (author != null) {
                dto.setAuthorId(author.getId());
                
                if (post.getIsAnonymous()) {
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
            log.error("Error converting post to DTO: {}", e.getMessage());
            dto.setAuthorId(null);
            dto.setAuthorName("Unknown User");
            dto.setAuthorAvatar(null);
        }
        
        dto.setIsAnonymous(post.getIsAnonymous());
        dto.setCategory(post.getCategory());
        dto.setIsPinned(post.getIsPinned());
        dto.setViewCount(post.getViewCount());
        dto.setLikeCount(post.getLikeCount());
        dto.setCommentCount(post.getCommentCount());
        dto.setStatus(post.getStatus());
        dto.setCreatedAt(post.getCreatedAt());
        dto.setUpdatedAt(post.getUpdatedAt());
        
        // Check if user liked this post
        if (userEmail != null) {
            User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user != null) {
                dto.setIsLiked(forumPostLikeRepository.existsByPostIdAndUserId(post.getId(), user.getId()));
            }
        }
        
        return dto;
    }
    
    private ForumCommentDTO convertToCommentDTO(ForumComment comment, String userEmail) {
        ForumCommentDTO dto = new ForumCommentDTO();
        dto.setId(comment.getId());
        dto.setPostId(comment.getPost().getId());
        dto.setUserId(comment.getUser().getId());
        
        try {
            if (comment.getIsAnonymous()) {
                dto.setUserName("Anonymous");
                dto.setUserAvatar(null);
            } else {
                User user = comment.getUser();
                if (user != null) {
                    String firstName = user.getFirstName() != null ? user.getFirstName() : "";
                    String lastName = user.getLastName() != null ? user.getLastName() : "";
                    String fullName = (firstName + " " + lastName).trim();
                    if (fullName.isEmpty()) {
                        fullName = user.getEmail() != null ? user.getEmail() : "Unknown User";
                    }
                    dto.setUserName(fullName);
                    dto.setUserAvatar(user.getAvatarUrl());
                } else {
                    dto.setUserName("Unknown User");
                    dto.setUserAvatar(null);
                }
            }
        } catch (Exception e) {
            log.error("Error converting comment to DTO: {}", e.getMessage());
            dto.setUserName("Unknown User");
            dto.setUserAvatar(null);
        }
        
        if (comment.getParent() != null) {
            dto.setParentId(comment.getParent().getId());
        }
        
        dto.setContent(comment.getContent());
        dto.setIsAnonymous(comment.getIsAnonymous());
        dto.setLikeCount(comment.getLikeCount());
        dto.setStatus(comment.getStatus());
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setUpdatedAt(comment.getUpdatedAt());
        
        // Check if user liked this comment
        if (userEmail != null) {
            User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user != null) {
                dto.setIsLiked(forumCommentLikeRepository.existsByCommentIdAndUserId(comment.getId(), user.getId()));
            }
        }
        
        // Get replies
        if (comment.getReplies() != null && !comment.getReplies().isEmpty()) {
            List<ForumCommentDTO> replies = comment.getReplies().stream()
                .filter(reply -> reply.getStatus() == ForumComment.ForumCommentStatus.active)
                .map(reply -> convertToCommentDTO(reply, userEmail))
                .collect(Collectors.toList());
            dto.setReplies(replies);
        }
        
        return dto;
    }
    
    private void updatePostLikeCount(Long postId) {
        ForumPost post = forumPostRepository.findById(postId).orElseThrow();
        long count = forumPostLikeRepository.countByPostId(postId);
        post.setLikeCount((int) count);
        forumPostRepository.save(post);
    }
    
    private void updatePostCommentCount(Long postId) {
        ForumPost post = forumPostRepository.findById(postId).orElseThrow();
        long count = forumCommentRepository.countByPostIdAndStatus(postId, ForumComment.ForumCommentStatus.active);
        post.setCommentCount((int) count);
        forumPostRepository.save(post);
    }
    
    private void updateCommentLikeCount(Long commentId) {
        ForumComment comment = forumCommentRepository.findById(commentId).orElseThrow();
        long count = forumCommentLikeRepository.countByCommentId(commentId);
        comment.setLikeCount((int) count);
        forumCommentRepository.save(comment);
    }
}

