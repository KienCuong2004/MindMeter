package com.shop.dto.blog;

import com.shop.backend.model.BlogPost;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlogPostRequest {
    
    private String title;
    private String content;
    private String excerpt;
    private BlogPost.BlogPostStatus status;
    private String featuredImage;
    private Boolean isFeatured;
    private List<Long> categoryIds;
    private List<Long> tagIds;
    private List<BlogPostImageRequest> images;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BlogPostImageRequest {
        private String imageUrl;
        private String altText;
        private String caption;
        private Integer displayOrder;
    }
}
