package com.shop.backend.repository;

import com.shop.backend.model.ForumComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ForumCommentRepository extends JpaRepository<ForumComment, Long> {
    
    // Find comments by post
    @EntityGraph(attributePaths = {"user"})
    Page<ForumComment> findByPostIdAndStatusOrderByCreatedAtAsc(
        Long postId, ForumComment.ForumCommentStatus status, Pageable pageable);
    
    // Find top-level comments (no parent)
    @EntityGraph(attributePaths = {"user"})
    Page<ForumComment> findByPostIdAndParentIsNullAndStatusOrderByCreatedAtAsc(
        Long postId, ForumComment.ForumCommentStatus status, Pageable pageable);
    
    // Find replies to a comment
    @EntityGraph(attributePaths = {"user"})
    List<ForumComment> findByParentIdAndStatusOrderByCreatedAtAsc(
        Long parentId, ForumComment.ForumCommentStatus status);
    
    // Find comments by user
    Page<ForumComment> findByUserIdAndStatusOrderByCreatedAtDesc(
        Long userId, ForumComment.ForumCommentStatus status, Pageable pageable);
    
    // Count comments by post
    long countByPostIdAndStatus(Long postId, ForumComment.ForumCommentStatus status);
    
    // Find comment by id and status
    Optional<ForumComment> findByIdAndStatus(Long id, ForumComment.ForumCommentStatus status);
}

