package com.shop.backend.controller;

import com.shop.dto.blog.*;
import com.shop.backend.service.BlogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/blog")
@CrossOrigin(origins = "*")
public class BlogController {
    
    @Autowired
    private BlogService blogService;
    
    // Blog Post Endpoints
    @GetMapping("/posts")
    public ResponseEntity<Page<BlogPostDTO>> getAllPosts(Pageable pageable, Authentication authentication) {
        String userEmail = authentication != null ? authentication.getName() : null;
        Page<BlogPostDTO> posts = blogService.getAllPosts(pageable, userEmail);
        return ResponseEntity.ok(posts);
    }
    
    @GetMapping("/posts/{slug}")
    public ResponseEntity<BlogPostDTO> getPostBySlug(@PathVariable String slug) {
        BlogPostDTO post = blogService.getPostBySlug(slug);
        if (post != null) {
            return ResponseEntity.ok(post);
        }
        return ResponseEntity.notFound().build();
    }
    
    @GetMapping("/posts/id/{id}")
    public ResponseEntity<BlogPostDTO> getPostById(@PathVariable Long id) {
        BlogPostDTO post = blogService.getPostById(id);
        if (post != null) {
            return ResponseEntity.ok(post);
        }
        return ResponseEntity.notFound().build();
    }
    
    @PostMapping("/admin/update-comment-counts")
    public ResponseEntity<String> updateAllCommentCounts() {
        blogService.updateAllCommentCounts();
        return ResponseEntity.ok("Comment counts updated successfully");
    }
    
    @GetMapping("/posts/search")
    public ResponseEntity<Page<BlogPostDTO>> searchPosts(@RequestParam String keyword, Pageable pageable) {
        Page<BlogPostDTO> posts = blogService.searchPosts(keyword, pageable);
        return ResponseEntity.ok(posts);
    }
    
    @GetMapping("/posts/category/{categoryId}")
    public ResponseEntity<Page<BlogPostDTO>> getPostsByCategory(@PathVariable Long categoryId, Pageable pageable) {
        Page<BlogPostDTO> posts = blogService.getPostsByCategory(categoryId, pageable);
        return ResponseEntity.ok(posts);
    }
    
    @GetMapping("/posts/tag/{tagId}")
    public ResponseEntity<Page<BlogPostDTO>> getPostsByTag(@PathVariable Long tagId, Pageable pageable) {
        Page<BlogPostDTO> posts = blogService.getPostsByTag(tagId, pageable);
        return ResponseEntity.ok(posts);
    }
    
    @PostMapping("/posts")
    public ResponseEntity<BlogPostDTO> createPost(@RequestBody BlogPostRequest request, Authentication authentication) {
        String authorEmail = getCurrentUserEmail(authentication);
        BlogPostDTO post = blogService.createPost(request, authorEmail);
        return ResponseEntity.ok(post);
    }
    
    @PutMapping("/posts/{id}")
    public ResponseEntity<BlogPostDTO> updatePost(@PathVariable Long id, @RequestBody BlogPostRequest request, Authentication authentication) {
        String authorEmail = getCurrentUserEmail(authentication);
        BlogPostDTO post = blogService.updatePost(id, request, authorEmail);
        return ResponseEntity.ok(post);
    }
    
    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id, Authentication authentication) {
        String authorEmail = getCurrentUserEmail(authentication);
        blogService.deletePost(id, authorEmail);
        return ResponseEntity.ok().build();
    }
    
    // Like Endpoints
    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<Boolean> toggleLike(@PathVariable Long postId, Authentication authentication) {
        String userEmail = getCurrentUserEmail(authentication);
        boolean isLiked = blogService.toggleLike(postId, userEmail);
        return ResponseEntity.ok(isLiked);
    }
    
    @GetMapping("/posts/{postId}/like")
    public ResponseEntity<Boolean> isLiked(@PathVariable Long postId, Authentication authentication) {
        String userEmail = getCurrentUserEmail(authentication);
        boolean isLiked = blogService.isLikedByUser(postId, userEmail);
        return ResponseEntity.ok(isLiked);
    }
    
    // Comment Endpoints
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<BlogCommentDTO> createComment(@PathVariable Long postId, @RequestBody BlogCommentRequest request, Authentication authentication) {
        String userEmail = getCurrentUserEmail(authentication);
        BlogCommentDTO comment = blogService.createComment(postId, request, userEmail);
        return ResponseEntity.ok(comment);
    }
    
    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<Page<BlogCommentDTO>> getComments(@PathVariable Long postId, Pageable pageable) {
        Page<BlogCommentDTO> comments = blogService.getComments(postId, pageable);
        return ResponseEntity.ok(comments);
    }
    
    // Share Endpoints
    @PostMapping("/posts/{postId}/share")
    public ResponseEntity<BlogShareDTO> createShare(@PathVariable Long postId, @RequestBody BlogShareRequest request, Authentication authentication) {
        String userEmail = getCurrentUserEmail(authentication);
        BlogShareDTO share = blogService.createShare(postId, request, userEmail);
        return ResponseEntity.ok(share);
    }
    
    // Bookmark Endpoints
    @PostMapping("/posts/{postId}/bookmark")
    public ResponseEntity<Boolean> toggleBookmark(@PathVariable Long postId, Authentication authentication) {
        String userEmail = getCurrentUserEmail(authentication);
        boolean isBookmarked = blogService.toggleBookmark(postId, userEmail);
        return ResponseEntity.ok(isBookmarked);
    }
    
    // View Endpoints
    @PostMapping("/posts/{postId}/view")
    public ResponseEntity<Void> recordView(@PathVariable Long postId, Authentication authentication, HttpServletRequest request) {
        String userEmail = authentication != null ? authentication.getName() : null;
        String ipAddress = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");
        blogService.recordView(postId, userEmail, ipAddress, userAgent);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/posts/{postId}/view/simple")
    public ResponseEntity<Void> recordViewSimple(@PathVariable Long postId) {
        try {
            System.out.println("BlogController.recordViewSimple() called with postId: " + postId);
            blogService.recordView(postId);
            System.out.println("BlogController.recordViewSimple() completed successfully");
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.err.println("Error in BlogController.recordViewSimple(): " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
    
    // Category Endpoints
    @GetMapping("/categories")
    public ResponseEntity<List<BlogCategoryDTO>> getAllCategories() {
        List<BlogCategoryDTO> categories = blogService.getAllCategories();
        return ResponseEntity.ok(categories);
    }
    
    // Tag Endpoints
    @GetMapping("/tags")
    public ResponseEntity<List<BlogTagDTO>> getAllTags() {
        List<BlogTagDTO> tags = blogService.getAllTags();
        return ResponseEntity.ok(tags);
    }
    
    // Helper Methods
    private String getCurrentUserEmail(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        return authentication.getName();
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedForHeader = request.getHeader("X-Forwarded-For");
        if (xForwardedForHeader == null) {
            return request.getRemoteAddr();
        } else {
            return xForwardedForHeader.split(",")[0];
        }
    }
}
