package com.shop.dto.blog;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlogTagDTO {
    
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String color;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Additional data
    private Long postCount;
}
