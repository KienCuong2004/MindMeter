package com.shop.dto.forum;

import com.shop.backend.model.ForumPost;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ForumPostRequest {
    private String title;
    private String content;
    private ForumPost.ForumCategory category;
    private Boolean isAnonymous;
}

