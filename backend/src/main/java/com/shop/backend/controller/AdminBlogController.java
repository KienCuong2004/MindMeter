package com.shop.backend.controller;

import com.shop.dto.blog.*;
import com.shop.backend.model.BlogPost;
import com.shop.backend.model.BlogComment;
import com.shop.backend.model.BlogReport;
import com.shop.backend.service.BlogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/admin/blog")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminBlogController {
    
    @Autowired
    private BlogService blogService;
    
    private String getCurrentUserEmail(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        return authentication.getName();
    }
    
    // Post Management
    @GetMapping("/posts")
    public ResponseEntity<Page<BlogPostDTO>> getAllPosts(
            @RequestParam(required = false) BlogPost.BlogPostStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) List<Long> categoryIds,
            @RequestParam(required = false) List<Long> tagIds,
            @RequestParam(required = false) Long authorId,
            @RequestParam(required = false) Boolean isFeatured,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            Pageable pageable,
            Authentication authentication) {
        String userEmail = getCurrentUserEmail(authentication);
        
        // Parse dates if provided
        LocalDateTime start = null;
        LocalDateTime end = null;
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
        if (startDate != null && !startDate.isEmpty()) {
            try {
                start = LocalDateTime.parse(startDate, formatter);
            } catch (Exception e) {
                // Try ISO format
                start = LocalDateTime.parse(startDate);
            }
        }
        if (endDate != null && !endDate.isEmpty()) {
            try {
                end = LocalDateTime.parse(endDate, formatter);
            } catch (Exception e) {
                // Try ISO format
                end = LocalDateTime.parse(endDate);
            }
        }
        
        // Use advanced search if any filters are provided
        if (keyword != null || categoryIds != null || tagIds != null || 
            authorId != null || isFeatured != null || start != null || end != null) {
            Page<BlogPostDTO> posts = blogService.searchPostsAdvanced(
                keyword, categoryIds, tagIds, status, authorId, isFeatured,
                start, end, pageable, userEmail);
            return ResponseEntity.ok(posts);
        }
        
        // Otherwise use simple status filter
        Page<BlogPostDTO> posts = blogService.getAllPostsForAdmin(status, pageable, userEmail);
        return ResponseEntity.ok(posts);
    }
    
    @GetMapping("/posts/pending")
    public ResponseEntity<Page<BlogPostDTO>> getPendingPosts(Pageable pageable, Authentication authentication) {
        String userEmail = getCurrentUserEmail(authentication);
        Page<BlogPostDTO> posts = blogService.getPendingPosts(pageable, userEmail);
        return ResponseEntity.ok(posts);
    }
    
    @PutMapping("/posts/{id}/approve")
    public ResponseEntity<BlogPostDTO> approvePost(@PathVariable Long id, Authentication authentication) {
        String adminEmail = getCurrentUserEmail(authentication);
        BlogPostDTO post = blogService.approvePost(id, adminEmail);
        return ResponseEntity.ok(post);
    }
    
    @PutMapping("/posts/{id}/reject")
    public ResponseEntity<BlogPostDTO> rejectPost(
            @PathVariable Long id,
            @RequestParam(required = false) String reason,
            Authentication authentication) {
        String adminEmail = getCurrentUserEmail(authentication);
        BlogPostDTO post = blogService.rejectPost(id, reason, adminEmail);
        return ResponseEntity.ok(post);
    }
    
    @PutMapping("/posts/{id}/publish")
    public ResponseEntity<BlogPostDTO> publishPost(@PathVariable Long id, Authentication authentication) {
        String adminEmail = getCurrentUserEmail(authentication);
        BlogPostDTO post = blogService.publishPost(id, adminEmail);
        return ResponseEntity.ok(post);
    }
    
    @PutMapping("/posts/{id}/unpublish")
    public ResponseEntity<BlogPostDTO> unpublishPost(@PathVariable Long id, Authentication authentication) {
        String adminEmail = getCurrentUserEmail(authentication);
        BlogPostDTO post = blogService.unpublishPost(id, adminEmail);
        return ResponseEntity.ok(post);
    }
    
    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id, Authentication authentication) {
        String adminEmail = getCurrentUserEmail(authentication);
        blogService.deletePostByAdmin(id, adminEmail);
        return ResponseEntity.ok().build();
    }
    
    // Comment Management
    @GetMapping("/comments")
    public ResponseEntity<Page<BlogCommentDTO>> getAllComments(@RequestParam(required = false) BlogComment.CommentStatus status, Pageable pageable) {
        // Page<BlogCommentDTO> comments = blogService.getAllCommentsForAdmin(status, pageable);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/comments/pending")
    public ResponseEntity<Page<BlogCommentDTO>> getPendingComments(Pageable pageable) {
        // Page<BlogCommentDTO> comments = blogService.getPendingComments(pageable);
        return ResponseEntity.ok().build();
    }
    
    @PutMapping("/comments/{id}/approve")
    public ResponseEntity<BlogCommentDTO> approveComment(@PathVariable Long id) {
        // BlogCommentDTO comment = blogService.approveComment(id);
        return ResponseEntity.ok().build();
    }
    
    @PutMapping("/comments/{id}/reject")
    public ResponseEntity<BlogCommentDTO> rejectComment(@PathVariable Long id, @RequestParam(required = false) String reason) {
        // BlogCommentDTO comment = blogService.rejectComment(id, reason);
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/comments/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id) {
        // blogService.deleteCommentByAdmin(id);
        return ResponseEntity.ok().build();
    }
    
    // Report Management
    @GetMapping("/reports")
    public ResponseEntity<Page<BlogReportDTO>> getAllReports(@RequestParam(required = false) BlogReport.ReportStatus status, Pageable pageable, Authentication authentication) {
        String adminEmail = getCurrentUserEmail(authentication);
        Page<BlogReportDTO> reports = blogService.getAllReportsForAdmin(status, pageable, adminEmail);
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/reports/pending")
    public ResponseEntity<Page<BlogReportDTO>> getPendingReports(Pageable pageable, Authentication authentication) {
        String adminEmail = getCurrentUserEmail(authentication);
        Page<BlogReportDTO> reports = blogService.getPendingReports(pageable, adminEmail);
        return ResponseEntity.ok(reports);
    }
    
    @PutMapping("/reports/{id}/review")
    public ResponseEntity<BlogReportDTO> reviewReport(@PathVariable Long id, @RequestParam BlogReport.ReportStatus status, @RequestParam(required = false) String adminNotes, Authentication authentication) {
        String adminEmail = getCurrentUserEmail(authentication);
        BlogReportDTO report = blogService.reviewReport(id, status, adminNotes, adminEmail);
        return ResponseEntity.ok(report);
    }
    
    // Category Management
    @GetMapping("/categories")
    public ResponseEntity<List<BlogCategoryDTO>> getAllCategories() {
        List<BlogCategoryDTO> categories = blogService.getAllCategories();
        return ResponseEntity.ok(categories);
    }
    
    @PostMapping("/categories")
    public ResponseEntity<BlogCategoryDTO> createCategory(@RequestBody BlogCategoryRequest request) {
        BlogCategoryDTO category = blogService.createCategory(request);
        return ResponseEntity.ok(category);
    }
    
    @PutMapping("/categories/{id}")
    public ResponseEntity<BlogCategoryDTO> updateCategory(@PathVariable Long id, @RequestBody BlogCategoryRequest request) {
        BlogCategoryDTO category = blogService.updateCategory(id, request);
        return ResponseEntity.ok(category);
    }
    
    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        blogService.deleteCategory(id);
        return ResponseEntity.ok().build();
    }
    
    // Tag Management
    @GetMapping("/tags")
    public ResponseEntity<List<BlogTagDTO>> getAllTags() {
        List<BlogTagDTO> tags = blogService.getAllTags();
        return ResponseEntity.ok(tags);
    }
    
    @PostMapping("/tags")
    public ResponseEntity<BlogTagDTO> createTag(@RequestBody BlogTagRequest request) {
        BlogTagDTO tag = blogService.createTag(request);
        return ResponseEntity.ok(tag);
    }
    
    @PutMapping("/tags/{id}")
    public ResponseEntity<BlogTagDTO> updateTag(@PathVariable Long id, @RequestBody BlogTagRequest request) {
        BlogTagDTO tag = blogService.updateTag(id, request);
        return ResponseEntity.ok(tag);
    }
    
    @DeleteMapping("/tags/{id}")
    public ResponseEntity<Void> deleteTag(@PathVariable Long id) {
        blogService.deleteTag(id);
        return ResponseEntity.ok().build();
    }
    
    // Statistics
    @GetMapping("/stats")
    public ResponseEntity<BlogStatsDTO> getBlogStats() {
        try {
            BlogStatsDTO stats = blogService.getBlogStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}
