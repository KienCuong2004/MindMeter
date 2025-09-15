package com.shop.backend.repository;

import com.shop.backend.model.BlogShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlogShareRepository extends JpaRepository<BlogShare, Long> {
    
    // Count shares for post
    long countByPostId(Long postId);
    
    // Count shares by platform
    long countByPostIdAndPlatform(Long postId, String platform);
    
    // Count shares by user
    long countByUserId(Long userId);
    
    // Find shares by post
    List<BlogShare> findByPostIdOrderByCreatedAtDesc(Long postId);
    
    // Find shares by user
    @Query("SELECT bs FROM BlogShare bs WHERE bs.user.id = :userId ORDER BY bs.createdAt DESC")
    List<BlogShare> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);
    
    // Check if user shared post
    boolean existsByPostIdAndUserId(Long postId, Long userId);
    
    // Check if user shared post on specific platform
    boolean existsByPostIdAndUserIdAndPlatform(Long postId, Long userId, String platform);
}
