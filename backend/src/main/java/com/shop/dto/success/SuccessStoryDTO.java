package com.shop.dto.success;

import com.shop.backend.model.SuccessStory;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SuccessStoryDTO {
    private Long id;
    private String title;
    private String content;
    private Long authorId;
    private String authorName;
    private String authorAvatar;
    private Boolean isAnonymous;
    private Boolean isFeatured;
    private Boolean isApproved;
    private Integer viewCount;
    private Integer likeCount;
    private Integer shareCount;
    private SuccessStory.StoryCategory category;
    private String tags;
    private LocalDateTime createdAt;
    private LocalDateTime publishedAt;
    private Boolean isLiked;
}

