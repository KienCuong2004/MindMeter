package com.shop.dto.blog;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlogTagRequest {
    
    private String name;
    private String description;
    private String color;
}
