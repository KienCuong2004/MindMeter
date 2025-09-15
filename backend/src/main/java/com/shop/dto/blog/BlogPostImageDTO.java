package com.shop.dto.blog;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlogPostImageDTO {
    
    private Long id;
    private Long postId;
    private String imageUrl;
    private String altText;
    private String caption;
    private Integer displayOrder;
    private LocalDateTime createdAt;
}
