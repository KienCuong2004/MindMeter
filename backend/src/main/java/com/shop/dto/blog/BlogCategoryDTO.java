package com.shop.dto.blog;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlogCategoryDTO {
    
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String color;
    private Long parentId;
    private String parentName;
    private Integer displayOrder;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Additional data
    private Long postCount;
    private List<BlogCategoryDTO> children;
}
