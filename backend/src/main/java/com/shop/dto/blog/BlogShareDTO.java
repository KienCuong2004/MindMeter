package com.shop.dto.blog;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlogShareDTO {
    
    private Long id;
    private Long postId;
    private Long userId;
    private String platform;
    private String sharedUrl;
    private LocalDateTime createdAt;
}
