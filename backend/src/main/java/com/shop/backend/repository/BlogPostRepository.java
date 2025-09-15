package com.shop.backend.repository;

import com.shop.backend.model.BlogPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {
    
    // Find by slug
    Optional<BlogPost> findBySlug(String slug);
    
    // Find by status
    Page<BlogPost> findByStatus(BlogPost.BlogPostStatus status, Pageable pageable);
    
    // Find by author
    Page<BlogPost> findByAuthorId(Long authorId, Pageable pageable);
    
    // Find by author and status
    Page<BlogPost> findByAuthorIdAndStatus(Long authorId, BlogPost.BlogPostStatus status, Pageable pageable);
    
    // Find published posts
    Page<BlogPost> findByStatusAndPublishedAtBeforeOrderByPublishedAtDesc(
        BlogPost.BlogPostStatus status, LocalDateTime publishedAt, Pageable pageable);
    
    // Find featured posts
    Page<BlogPost> findByIsFeaturedTrueAndStatusOrderByPublishedAtDesc(
        BlogPost.BlogPostStatus status, Pageable pageable);
    
    // Search posts by title or content
    @Query("SELECT p FROM BlogPost p WHERE p.status = :status AND " +
           "(LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<BlogPost> searchPosts(@Param("status") BlogPost.BlogPostStatus status, 
                               @Param("keyword") String keyword, Pageable pageable);
    
    // Find posts by category
    @Query("SELECT p FROM BlogPost p JOIN p.postCategories pc WHERE pc.category.id = :categoryId AND p.status = :status")
    Page<BlogPost> findByCategoryIdAndStatus(@Param("categoryId") Long categoryId, 
                                            @Param("status") BlogPost.BlogPostStatus status, Pageable pageable);
    
    // Find posts by tag
    @Query("SELECT p FROM BlogPost p JOIN p.postTags pt WHERE pt.tag.id = :tagId AND p.status = :status")
    Page<BlogPost> findByTagIdAndStatus(@Param("tagId") Long tagId, 
                                       @Param("status") BlogPost.BlogPostStatus status, Pageable pageable);
    
    // Find posts by author and status with search
    @Query("SELECT p FROM BlogPost p WHERE p.author.id = :authorId AND p.status = :status AND " +
           "(LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<BlogPost> findByAuthorIdAndStatusAndSearch(@Param("authorId") Long authorId, 
                                                   @Param("status") BlogPost.BlogPostStatus status,
                                                   @Param("keyword") String keyword, Pageable pageable);
    
    // Count posts by status
    long countByStatus(BlogPost.BlogPostStatus status);
    
    // Count posts by author
    long countByAuthorId(Long authorId);
    
    // Find most popular posts (by view count)
    @Query("SELECT p FROM BlogPost p WHERE p.status = :status ORDER BY p.viewCount DESC")
    Page<BlogPost> findMostPopularPosts(@Param("status") BlogPost.BlogPostStatus status, Pageable pageable);
    
    // Find most liked posts
    @Query("SELECT p FROM BlogPost p WHERE p.status = :status ORDER BY p.likeCount DESC")
    Page<BlogPost> findMostLikedPosts(@Param("status") BlogPost.BlogPostStatus status, Pageable pageable);
    
    // Find recent posts
    @Query("SELECT p FROM BlogPost p WHERE p.status = :status ORDER BY p.publishedAt DESC")
    Page<BlogPost> findRecentPosts(@Param("status") BlogPost.BlogPostStatus status, Pageable pageable);
    
    // Check if slug exists (for validation)
    boolean existsBySlug(String slug);
    
    // Check if slug exists excluding current post (for update)
    boolean existsBySlugAndIdNot(String slug, Long id);
}
