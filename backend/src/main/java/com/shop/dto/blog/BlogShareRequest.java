package com.shop.dto.blog;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlogShareRequest {
    
    private String platform;
    private String sharedUrl;
}
