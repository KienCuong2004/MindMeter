package com.shop.dto.forum;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ForumCommentRequest {
    private String content;
    private Long parentId;
    private Boolean isAnonymous;
}

