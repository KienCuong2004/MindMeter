package com.shop.dto.blog;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlogCategoryRequest {
    
    private String name;
    private String description;
    private String color;
    private Long parentId;
    private Integer displayOrder;
    private Boolean isActive;
}
