package com.shop.backend.repository;

import com.shop.backend.model.BlogCommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BlogCommentLikeRepository extends JpaRepository<BlogCommentLike, Long> {
    
    // Find like by comment and user
    Optional<BlogCommentLike> findByCommentIdAndUserId(Long commentId, Long userId);
    
    // Check if user liked comment
    boolean existsByCommentIdAndUserId(Long commentId, Long userId);
    
    // Count likes for comment
    long countByCommentId(Long commentId);
    
    // Delete like by comment and user
    void deleteByCommentIdAndUserId(Long commentId, Long userId);
}
