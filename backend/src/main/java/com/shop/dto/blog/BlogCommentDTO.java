package com.shop.dto.blog;

import com.shop.backend.model.BlogComment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlogCommentDTO {
    
    private Long id;
    private Long postId;
    private Long userId;
    private String userName;
    private String userAvatar;
    private String userEmail;
    private Long parentId;
    private String content;
    private BlogComment.CommentStatus status;
    private Integer likeCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Relationships
    private List<BlogCommentDTO> replies;
    
    // User interaction flags
    private Boolean isLiked;
    
    // Content moderation flags
    private Boolean isFlagged;
    private String violationType;
    private String violationReason;
}
