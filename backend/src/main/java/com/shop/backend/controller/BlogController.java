package com.shop.backend.controller;

import com.shop.dto.blog.*;
import com.shop.backend.service.BlogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

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

    // Admin endpoint to get all posts (including pending)
    @GetMapping("/admin/posts")
    public ResponseEntity<Page<BlogPostDTO>> getAllPostsForAdmin(Pageable pageable, Authentication authentication) {
        String userEmail = authentication != null ? authentication.getName() : null;
        Page<BlogPostDTO> posts = blogService.getAllPostsForAdmin(pageable, userEmail);
        return ResponseEntity.ok(posts);
    }
    
    @GetMapping("/posts/{id}")
    public ResponseEntity<BlogPostDTO> getPostByIdOrSlug(@PathVariable String id, Authentication authentication) {
        String userEmail = null;
        if (authentication != null && authentication.isAuthenticated()) {
            userEmail = getCurrentUserEmail(authentication);
        }
        
        BlogPostDTO post;
        
        // Try to parse as Long ID first
        try {
            Long postId = Long.parseLong(id);
            post = blogService.getPostById(postId, userEmail);
        } catch (NumberFormatException e) {
            // If not a number, treat as slug
            post = blogService.getPostBySlug(id, userEmail);
        }
        
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
    
    @GetMapping("/posts/{id}/public")
    public ResponseEntity<BlogPostDTO> getPostPublic(@PathVariable Long id, Authentication authentication) {
        String userEmail = null;
        if (authentication != null && authentication.isAuthenticated()) {
            userEmail = getCurrentUserEmail(authentication);
        }
        BlogPostDTO post = blogService.getPostByIdPublic(id, userEmail);
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
    
    
    // Record view for a blog post
    @PostMapping("/posts/{id}/view")
    public ResponseEntity<String> recordView(@PathVariable Long id) {
        blogService.recordView(id);
        return ResponseEntity.ok("View recorded");
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
    
    // Upload featured image
    @PostMapping("/upload-image")
    public ResponseEntity<String> uploadImage(@RequestParam("file") MultipartFile file, Authentication authentication) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }
            
            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body("Only image files are allowed");
            }
            
            // Create upload directory if it doesn't exist
            String uploadDir = System.getProperty("user.dir") + "/uploads/blog";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null ? 
                originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
            String filename = UUID.randomUUID().toString() + extension;
            
            // Save file
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath);
            
            // Return the file URL
            String fileUrl = "/uploads/blog/" + filename;
            return ResponseEntity.ok(fileUrl);
            
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Failed to upload file: " + e.getMessage());
        }
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

           // Admin endpoints
           @PutMapping("/posts/{id}/status")
           public ResponseEntity<BlogPostDTO> updatePostStatus(@PathVariable Long id, @RequestBody Map<String, String> request, Authentication authentication) {
               try {
                   System.out.println("BlogController.updatePostStatus() called with id: " + id + ", request: " + request);
                   String userEmail = getCurrentUserEmail(authentication);
                   String status = request.get("status");
                   String rejectionReason = request.get("rejectionReason");
                   
                   System.out.println("Extracted status: " + status + ", rejectionReason: " + rejectionReason + ", userEmail: " + userEmail);
                   
                   BlogPostDTO post = blogService.updatePostStatus(id, status, rejectionReason, userEmail);
                   System.out.println("BlogService returned post: " + post.getTitle() + " with status: " + post.getStatus());
                   return ResponseEntity.ok(post);
               } catch (Exception e) {
                   System.err.println("Error in BlogController.updatePostStatus: " + e.getMessage());
                   e.printStackTrace();
                   return ResponseEntity.status(500).build();
               }
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
        try {
            System.out.println("BlogController.getComments() called with postId: " + postId);
            Page<BlogCommentDTO> comments = blogService.getComments(postId, pageable);
            System.out.println("BlogController.getComments() completed successfully, found " + comments.getTotalElements() + " comments");
            return ResponseEntity.ok(comments);
        } catch (Exception e) {
            System.err.println("Error in BlogController.getComments(): " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
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
