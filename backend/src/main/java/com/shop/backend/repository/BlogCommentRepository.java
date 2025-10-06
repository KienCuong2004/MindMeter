package com.shop.backend.repository;

import com.shop.backend.model.BlogComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlogCommentRepository extends JpaRepository<BlogComment, Long> {
    
    // Find comments by post (ordered by most recent activity - updatedAt, then createdAt)
    Page<BlogComment> findByPostIdAndStatusOrderByUpdatedAtDesc(Long postId, BlogComment.CommentStatus status, Pageable pageable);
    
    // Legacy method - keep for backward compatibility
    Page<BlogComment> findByPostIdAndStatusOrderByCreatedAtDesc(Long postId, BlogComment.CommentStatus status, Pageable pageable);
    
    // Find top-level comments (no parent)
    Page<BlogComment> findByPostIdAndParentIsNullAndStatusOrderByCreatedAtDesc(Long postId, BlogComment.CommentStatus status, Pageable pageable);
    
    // Find replies to a comment
    List<BlogComment> findByParentIdAndStatusOrderByCreatedAtAsc(Long parentId, BlogComment.CommentStatus status);
    
    // Find comments by user
    Page<BlogComment> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    // Count comments by post
    long countByPostIdAndStatus(Long postId, BlogComment.CommentStatus status);
    
    // Count comments by user
    long countByUserId(Long userId);
    
    // Find comments by status (for admin)
    Page<BlogComment> findByStatusOrderByCreatedAtDesc(BlogComment.CommentStatus status, Pageable pageable);
    
    // Find pending comments count
    long countByStatus(BlogComment.CommentStatus status);
    
    // Find comments by post and user
    @Query("SELECT c FROM BlogComment c WHERE c.post.id = :postId AND c.user.id = :userId ORDER BY c.createdAt DESC")
    List<BlogComment> findByPostIdAndUserIdOrderByCreatedAtDesc(@Param("postId") Long postId, @Param("userId") Long userId);
    
    // Native query to bypass JPA cache completely
    @Query(value = "SELECT SQL_NO_CACHE * FROM blog_comments WHERE post_id = :postId AND status = :status ORDER BY updated_at DESC, created_at DESC LIMIT :limit OFFSET :offset", nativeQuery = true)
    List<BlogComment> findCommentsByPostIdNative(@Param("postId") Long postId, @Param("status") String status, @Param("limit") int limit, @Param("offset") int offset);
}
