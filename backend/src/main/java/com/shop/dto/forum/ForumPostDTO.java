package com.shop.dto.forum;

import com.shop.backend.model.ForumPost;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ForumPostDTO {
    private Long id;
    private String title;
    private String content;
    private Long authorId;
    private String authorName;
    private String authorAvatar;
    private Boolean isAnonymous;
    private ForumPost.ForumCategory category;
    private Boolean isPinned;
    private Integer viewCount;
    private Integer likeCount;
    private Integer commentCount;
    private ForumPost.ForumPostStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isLiked;
}

