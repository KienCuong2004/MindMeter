package com.shop.backend.repository;

import com.shop.backend.model.ForumPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ForumPostRepository extends JpaRepository<ForumPost, Long> {
    
    // Find active posts with pagination
    Page<ForumPost> findByStatusOrderByCreatedAtDesc(ForumPost.ForumPostStatus status, Pageable pageable);
    
    // Find posts by category
    Page<ForumPost> findByCategoryAndStatusOrderByCreatedAtDesc(
        ForumPost.ForumCategory category, ForumPost.ForumPostStatus status, Pageable pageable);
    
    // Find pinned posts
    Page<ForumPost> findByIsPinnedTrueAndStatusOrderByCreatedAtDesc(
        ForumPost.ForumPostStatus status, Pageable pageable);
    
    // Find posts by author
    Page<ForumPost> findByAuthorIdAndStatusOrderByCreatedAtDesc(
        Long authorId, ForumPost.ForumPostStatus status, Pageable pageable);
    
    // Search posts by title or content
    @Query("SELECT p FROM ForumPost p WHERE " +
           "(LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND p.status = :status")
    Page<ForumPost> searchPosts(@Param("status") ForumPost.ForumPostStatus status, 
                                 @Param("keyword") String keyword, Pageable pageable);
    
    // Count posts by status
    long countByStatus(ForumPost.ForumPostStatus status);
    
    // Count posts by category
    long countByCategoryAndStatus(ForumPost.ForumCategory category, ForumPost.ForumPostStatus status);
    
    // Find post by id and status
    Optional<ForumPost> findByIdAndStatus(Long id, ForumPost.ForumPostStatus status);
}

