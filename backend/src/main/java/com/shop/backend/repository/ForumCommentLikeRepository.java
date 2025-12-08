package com.shop.backend.repository;

import com.shop.backend.model.ForumCommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ForumCommentLikeRepository extends JpaRepository<ForumCommentLike, Long> {
    
    Optional<ForumCommentLike> findByCommentIdAndUserId(Long commentId, Long userId);
    
    boolean existsByCommentIdAndUserId(Long commentId, Long userId);
    
    long countByCommentId(Long commentId);
    
    void deleteByCommentIdAndUserId(Long commentId, Long userId);
}

