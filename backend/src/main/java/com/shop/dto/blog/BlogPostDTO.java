package com.shop.dto.blog;

import com.shop.backend.model.BlogPost;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlogPostDTO {
    
    private Long id;
    private String title;
    private String slug;
    private String content;
    private String excerpt;
    private Long authorId;
    private String authorName;
    private String authorAvatar;
    private String authorEmail;
    private BlogPost.BlogPostStatus status;
    private String featuredImage;
    private Integer viewCount;
    private Integer likeCount;
    private Integer commentCount;
    private Integer shareCount;
    private Boolean isFeatured;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Relationships
    private List<BlogCategoryDTO> categories;
    private List<BlogTagDTO> tags;
    private List<BlogPostImageDTO> images;
    
    // User interaction flags
    private Boolean isLiked;
    private Boolean isBookmarked;
    private Boolean isShared;
    
    // Summary data
    private String readingTime;
    private String shortContent;
}
