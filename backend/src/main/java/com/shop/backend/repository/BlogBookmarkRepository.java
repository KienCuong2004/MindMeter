package com.shop.backend.repository;

import com.shop.backend.model.BlogBookmark;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BlogBookmarkRepository extends JpaRepository<BlogBookmark, Long> {
    
    // Find bookmark by post and user
    Optional<BlogBookmark> findByPostIdAndUserId(Long postId, Long userId);
    
    // Check if user bookmarked post
    boolean existsByPostIdAndUserId(Long postId, Long userId);
    
    // Find bookmarks by user
    @Query("SELECT bb FROM BlogBookmark bb WHERE bb.user.id = :userId ORDER BY bb.createdAt DESC")
    Page<BlogBookmark> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId, Pageable pageable);
    
    // Count bookmarks by user
    long countByUserId(Long userId);
    
    // Delete bookmark by post and user
    void deleteByPostIdAndUserId(Long postId, Long userId);
}
