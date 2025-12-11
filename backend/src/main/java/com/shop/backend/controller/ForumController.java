package com.shop.backend.controller;

import com.shop.dto.forum.ForumPostDTO;
import com.shop.dto.forum.ForumPostRequest;
import com.shop.dto.forum.ForumCommentDTO;
import com.shop.dto.forum.ForumCommentRequest;
import com.shop.backend.model.ForumPost;
import com.shop.backend.service.ForumService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/forum")
@CrossOrigin(origins = "*")
public class ForumController {
    
    @Autowired
    private ForumService forumService;
    
    @GetMapping("/posts")
    public ResponseEntity<Page<ForumPostDTO>> getAllPosts(
            @RequestParam(required = false) ForumPost.ForumCategory category,
            Pageable pageable,
            Authentication authentication) {
        String userEmail = authentication != null ? authentication.getName() : null;
        
        Page<ForumPostDTO> posts;
        if (category != null) {
            posts = forumService.getPostsByCategory(category, pageable, userEmail);
        } else {
            posts = forumService.getAllPosts(pageable, userEmail);
        }
        
        return ResponseEntity.ok(posts);
    }
    
    @GetMapping("/posts/{id}")
    public ResponseEntity<ForumPostDTO> getPostById(
            @PathVariable Long id,
            Authentication authentication) {
        String userEmail = authentication != null ? authentication.getName() : null;
        ForumPostDTO post = forumService.getPostById(id, userEmail);
        
        if (post != null) {
            return ResponseEntity.ok(post);
        }
        return ResponseEntity.notFound().build();
    }
    
    @PostMapping("/posts")
    public ResponseEntity<ForumPostDTO> createPost(
            @RequestBody ForumPostRequest request,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        
        String userEmail = authentication.getName();
        try {
            ForumPostDTO post = forumService.createPost(request, userEmail);
            return ResponseEntity.ok(post);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/posts/{id}")
    public ResponseEntity<ForumPostDTO> updatePost(
            @PathVariable Long id,
            @RequestBody ForumPostRequest request,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        
        String userEmail = authentication.getName();
        try {
            ForumPostDTO post = forumService.updatePost(id, request, userEmail);
            return ResponseEntity.ok(post);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long id,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        
        String userEmail = authentication.getName();
        try {
            forumService.deletePost(id, userEmail);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<Void> toggleLikePost(
            @PathVariable Long postId,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        
        String userEmail = authentication.getName();
        forumService.toggleLikePost(postId, userEmail);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/posts/{postId}/view")
    public ResponseEntity<Void> incrementViewCount(@PathVariable Long postId) {
        forumService.incrementViewCount(postId);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<Page<ForumCommentDTO>> getComments(
            @PathVariable Long postId,
            Pageable pageable,
            Authentication authentication) {
        String userEmail = authentication != null ? authentication.getName() : null;
        Page<ForumCommentDTO> comments = forumService.getCommentsByPost(postId, pageable, userEmail);
        return ResponseEntity.ok(comments);
    }
    
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<ForumCommentDTO> createComment(
            @PathVariable Long postId,
            @RequestBody ForumCommentRequest request,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        
        String userEmail = authentication.getName();
        try {
            ForumCommentDTO comment = forumService.createComment(postId, request, userEmail);
            return ResponseEntity.ok(comment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<Void> toggleLikeComment(
            @PathVariable Long commentId,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        
        String userEmail = authentication.getName();
        forumService.toggleLikeComment(commentId, userEmail);
        return ResponseEntity.ok().build();
    }
}

