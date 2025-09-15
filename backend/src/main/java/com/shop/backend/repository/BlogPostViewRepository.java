package com.shop.backend.repository;

import com.shop.backend.model.BlogPostView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BlogPostViewRepository extends JpaRepository<BlogPostView, Long> {
    
    // Count views for post
    long countByPostId(Long postId);
    
    // Count views by user
    long countByUserId(Long userId);
    
    // Count views by IP
    long countByIpAddress(String ipAddress);
    
    // Count views for post by IP
    long countByPostIdAndIpAddress(Long postId, String ipAddress);
    
    // Count views for post by user
    long countByPostIdAndUserId(Long postId, Long userId);
    
    // Find views by post
    List<BlogPostView> findByPostIdOrderByViewedAtDesc(Long postId);
    
    // Find views by user
    @Query("SELECT bpv FROM BlogPostView bpv WHERE bpv.user.id = :userId ORDER BY bpv.viewedAt DESC")
    List<BlogPostView> findByUserIdOrderByViewedAtDesc(@Param("userId") Long userId);
    
    // Find recent views
    @Query("SELECT bpv FROM BlogPostView bpv WHERE bpv.viewedAt >= :since ORDER BY bpv.viewedAt DESC")
    List<BlogPostView> findRecentViews(@Param("since") LocalDateTime since);
    
    // Count views in date range
    @Query("SELECT COUNT(bpv) FROM BlogPostView bpv WHERE bpv.post.id = :postId AND bpv.viewedAt BETWEEN :startDate AND :endDate")
    long countViewsInDateRange(@Param("postId") Long postId, 
                              @Param("startDate") LocalDateTime startDate, 
                              @Param("endDate") LocalDateTime endDate);
}
