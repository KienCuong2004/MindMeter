package com.shop.backend.repository;

import com.shop.backend.model.BlogLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BlogLikeRepository extends JpaRepository<BlogLike, Long> {
    
    // Find like by post and user
    Optional<BlogLike> findByPostIdAndUserId(Long postId, Long userId);
    
    // Check if user liked post
    boolean existsByPostIdAndUserId(Long postId, Long userId);
    
    // Count likes for post
    long countByPostId(Long postId);
    
    // Count likes by user
    long countByUserId(Long userId);
    
    // Delete like by post and user
    void deleteByPostIdAndUserId(Long postId, Long userId);
    
    // Find likes by user
    @Query("SELECT bl FROM BlogLike bl WHERE bl.user.id = :userId ORDER BY bl.createdAt DESC")
    java.util.List<BlogLike> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);
}
