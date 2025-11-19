package com.shop.backend.repository;

import com.shop.backend.model.BlogPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {
    
    // Find published posts with pagination
    Page<BlogPost> findByStatusAndPublishedAtBeforeOrderByPublishedAtDesc(
        BlogPost.BlogPostStatus status, LocalDateTime publishedAt, Pageable pageable);
    
    // Find published posts (without publishedAt filter for posts without publishedAt set)
    @Query("SELECT p FROM BlogPost p WHERE p.status = :status AND (p.publishedAt IS NULL OR p.publishedAt <= :now) ORDER BY COALESCE(p.publishedAt, p.createdAt) DESC")
    Page<BlogPost> findByPublishedStatus(@Param("status") BlogPost.BlogPostStatus status, @Param("now") LocalDateTime now, Pageable pageable);
    
    // Find published posts (simpler version - just by status)
    Page<BlogPost> findByStatusOrderByPublishedAtDesc(BlogPost.BlogPostStatus status, Pageable pageable);
    
    // Find posts by category
    @Query("SELECT p FROM BlogPost p JOIN p.postCategories pc WHERE pc.category.id = :categoryId AND p.status = :status")
    Page<BlogPost> findByCategoryIdAndStatus(@Param("categoryId") Long categoryId, @Param("status") BlogPost.BlogPostStatus status, Pageable pageable);
    
    // Find posts by tag
    @Query("SELECT p FROM BlogPost p JOIN p.postTags pt WHERE pt.tag.id = :tagId AND p.status = :status")
    Page<BlogPost> findByTagIdAndStatus(@Param("tagId") Long tagId, @Param("status") BlogPost.BlogPostStatus status, Pageable pageable);
    
    // Find posts by multiple tag IDs (posts that have ANY of the tags)
    @Query("SELECT DISTINCT p FROM BlogPost p JOIN p.postTags pt WHERE pt.tag.id IN :tagIds AND p.status = :status")
    Page<BlogPost> findByTagIdsAndStatus(@Param("tagIds") List<Long> tagIds, @Param("status") BlogPost.BlogPostStatus status, Pageable pageable);
    
    // Find posts by multiple category IDs (posts that have ANY of the categories)
    @Query("SELECT DISTINCT p FROM BlogPost p JOIN p.postCategories pc WHERE pc.category.id IN :categoryIds AND p.status = :status")
    Page<BlogPost> findByCategoryIdsAndStatus(@Param("categoryIds") List<Long> categoryIds, @Param("status") BlogPost.BlogPostStatus status, Pageable pageable);
    
    // Search posts by title or content
    @Query("SELECT p FROM BlogPost p WHERE (LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND p.status = :status")
    Page<BlogPost> searchPosts(@Param("status") BlogPost.BlogPostStatus status, @Param("keyword") String keyword, Pageable pageable);
    
    // Find post by slug
    Optional<BlogPost> findBySlug(String slug);
    
    // Check if slug exists
    boolean existsBySlug(String slug);
    
    // Find post by id and status
    Optional<BlogPost> findByIdAndStatus(Long id, BlogPost.BlogPostStatus status);
    
    // Count posts by status
    long countByStatus(BlogPost.BlogPostStatus status);
    
    // Find posts by status
    Page<BlogPost> findByStatus(BlogPost.BlogPostStatus status, Pageable pageable);
    
    // Find posts by author
    @Query("SELECT p FROM BlogPost p WHERE p.author.id = :authorId AND p.status = :status")
    Page<BlogPost> findByAuthorIdAndStatus(@Param("authorId") Long authorId, @Param("status") BlogPost.BlogPostStatus status, Pageable pageable);
    
    // Find featured posts
    Page<BlogPost> findByIsFeaturedTrueAndStatusOrderByPublishedAtDesc(BlogPost.BlogPostStatus status, Pageable pageable);
}
