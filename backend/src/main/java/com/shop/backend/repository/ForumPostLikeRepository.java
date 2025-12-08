package com.shop.backend.repository;

import com.shop.backend.model.ForumPostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ForumPostLikeRepository extends JpaRepository<ForumPostLike, Long> {
    
    Optional<ForumPostLike> findByPostIdAndUserId(Long postId, Long userId);
    
    boolean existsByPostIdAndUserId(Long postId, Long userId);
    
    long countByPostId(Long postId);
    
    void deleteByPostIdAndUserId(Long postId, Long userId);
}

