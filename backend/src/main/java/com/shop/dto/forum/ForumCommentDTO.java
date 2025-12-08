package com.shop.dto.forum;

import com.shop.backend.model.ForumComment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ForumCommentDTO {
    private Long id;
    private Long postId;
    private Long userId;
    private String userName;
    private String userAvatar;
    private Long parentId;
    private String content;
    private Boolean isAnonymous;
    private Integer likeCount;
    private ForumComment.ForumCommentStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isLiked;
    private List<ForumCommentDTO> replies;
}

