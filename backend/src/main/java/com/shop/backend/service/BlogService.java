package com.shop.backend.service;

import com.shop.dto.blog.*;
import com.shop.backend.model.*;
import com.shop.backend.repository.*;
import com.shop.backend.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class BlogService {
    
    @Value("${app.backend.url}")
    private String backendUrl;
    
    @Autowired
    private BlogPostRepository blogPostRepository;
    
    @Autowired
    private BlogCategoryRepository blogCategoryRepository;
    
    @Autowired
    private BlogTagRepository blogTagRepository;
    
    @Autowired
    private BlogLikeRepository blogLikeRepository;
    
    @Autowired
    private BlogCommentRepository blogCommentRepository;
    
    @PersistenceContext
    private EntityManager entityManager;
    
    // @Autowired
    // private BlogCommentLikeRepository blogCommentLikeRepository; // Not used yet
    
    @Autowired
    private BlogShareRepository blogShareRepository;
    
    @Autowired
    private BlogBookmarkRepository blogBookmarkRepository;
    
    @Autowired
    private BlogPostViewRepository blogPostViewRepository;
    
    // @Autowired
    // private BlogReportRepository blogReportRepository; // Not used yet
    
    @Autowired
    private BlogPostCategoryRepository blogPostCategoryRepository;
    
    @Autowired
    private BlogPostTagRepository blogPostTagRepository;
    
    @Autowired
    private com.shop.backend.repository.UserRepository userRepository;
    
    // Blog Post Methods
    public Page<BlogPostDTO> getAllPosts(Pageable pageable) {
        Page<BlogPost> posts = blogPostRepository.findByStatusAndPublishedAtBeforeOrderByPublishedAtDesc(
            BlogPost.BlogPostStatus.published, LocalDateTime.now(), pageable);
        return posts.map(this::convertToDTO);
    }
    
    public Page<BlogPostDTO> getAllPosts(Pageable pageable, String userEmail) {
        Page<BlogPost> posts = blogPostRepository.findByStatusAndPublishedAtBeforeOrderByPublishedAtDesc(
            BlogPost.BlogPostStatus.published, LocalDateTime.now(), pageable);
        return posts.map(post -> convertToDTO(post, userEmail));
    }

    // Admin method to get all posts (including pending, draft, etc.)
    public Page<BlogPostDTO> getAllPostsForAdmin(Pageable pageable, String userEmail) {
        Page<BlogPost> posts = blogPostRepository.findAll(pageable);
        return posts.map(post -> convertToDTO(post, userEmail));
    }
    
    public Page<BlogPostDTO> getPostsByCategory(Long categoryId, Pageable pageable) {
        Page<BlogPost> posts = blogPostRepository.findByCategoryIdAndStatus(
            categoryId, BlogPost.BlogPostStatus.published, pageable);
        return posts.map(post -> convertToDTO(post, null));
    }
    
    public Page<BlogPostDTO> getPostsByTag(Long tagId, Pageable pageable) {
        Page<BlogPost> posts = blogPostRepository.findByTagIdAndStatus(
            tagId, BlogPost.BlogPostStatus.published, pageable);
        return posts.map(post -> convertToDTO(post, null));
    }
    
    public Page<BlogPostDTO> searchPosts(String keyword, Pageable pageable) {
        Page<BlogPost> posts = blogPostRepository.searchPosts(
            BlogPost.BlogPostStatus.published, keyword, pageable);
        return posts.map(post -> convertToDTO(post, null));
    }
    
    public BlogPostDTO getPostBySlug(String slug) {
        return getPostBySlug(slug, null);
    }
    
    public BlogPostDTO getPostBySlug(String slug, String userEmail) {
        Optional<BlogPost> post = blogPostRepository.findBySlug(slug);
        return post.map(p -> convertToDTO(p, userEmail)).orElse(null);
    }
    
    public BlogPostDTO getPostById(Long id) {
        return getPostById(id, null);
    }
    
    public BlogPostDTO getPostById(Long id, String userEmail) {
        Optional<BlogPost> post = blogPostRepository.findById(id);
        if (post.isPresent()) {
            // Debug comment count
            long actualCommentCount = blogCommentRepository.countByPostIdAndStatus(id, BlogComment.CommentStatus.approved);
            System.out.println("Post ID: " + id + ", Database comment count: " + post.get().getCommentCount() + ", Actual comment count: " + actualCommentCount);
            
            // Force update comment count before returning
            updateCommentCount(id);
            
            // Refresh post from database after update
            post = blogPostRepository.findById(id);
            return convertToDTO(post.get(), userEmail);
        }
        return null;
    }
    
    public BlogPostDTO getPostByIdPublic(Long id) {
        return getPostByIdPublic(id, null);
    }
    
    public BlogPostDTO getPostByIdPublic(Long id, String userEmail) {
        // For public access, only return published posts
        Optional<BlogPost> post = blogPostRepository.findByIdAndStatus(id, BlogPost.BlogPostStatus.published);
        if (post.isPresent()) {
            // Force update comment count before returning
            updateCommentCount(id);
            
            // Refresh post from database after update
            post = blogPostRepository.findByIdAndStatus(id, BlogPost.BlogPostStatus.published);
            return convertToDTO(post.get(), userEmail);
        }
        return null;
    }
    
    public BlogPostDTO createPost(BlogPostRequest request, String authorEmail) {
        User author = userRepository.findByEmail(authorEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        BlogPost post = new BlogPost();
        post.setTitle(request.getTitle());
        post.setSlug(generateSlug(request.getTitle()));
        post.setContent(request.getContent());
        post.setExcerpt(request.getExcerpt());
        post.setAuthor(author);
        post.setStatus(request.getStatus());
        post.setFeaturedImage(request.getFeaturedImage());
        post.setIsFeatured(request.getIsFeatured());
        
        if (request.getStatus() == BlogPost.BlogPostStatus.published) {
            post.setPublishedAt(LocalDateTime.now());
        }
        
        post = blogPostRepository.save(post);
        
        // Save categories
        if (request.getCategoryIds() != null) {
            for (Long categoryId : request.getCategoryIds()) {
                BlogCategory category = blogCategoryRepository.findById(categoryId)
                    .orElseThrow(() -> new RuntimeException("Category not found"));
                BlogPostCategory postCategory = new BlogPostCategory();
                postCategory.setPost(post);
                postCategory.setCategory(category);
                blogPostCategoryRepository.save(postCategory);
            }
        }
        
        // Save tags
        if (request.getTagIds() != null) {
            for (Long tagId : request.getTagIds()) {
                BlogTag tag = blogTagRepository.findById(tagId)
                    .orElseThrow(() -> new RuntimeException("Tag not found"));
                BlogPostTag postTag = new BlogPostTag();
                postTag.setPost(post);
                postTag.setTag(tag);
                blogPostTagRepository.save(postTag);
            }
        }
        
        return convertToDTO(post);
    }
    
    public BlogPostDTO updatePost(Long id, BlogPostRequest request, String authorEmail) {
        BlogPost post = blogPostRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        
        if (!post.getAuthor().getEmail().equals(authorEmail)) {
            throw new RuntimeException("Unauthorized to update this post");
        }
        
        // Only update slug if title changed
        if (!post.getTitle().equals(request.getTitle())) {
            post.setTitle(request.getTitle());
            post.setSlug(generateSlug(request.getTitle()));
        }
        post.setContent(request.getContent());
        post.setExcerpt(request.getExcerpt());
        post.setStatus(request.getStatus());
        post.setFeaturedImage(request.getFeaturedImage());
        post.setIsFeatured(request.getIsFeatured());
        
        if (request.getStatus() == BlogPost.BlogPostStatus.published && post.getPublishedAt() == null) {
            post.setPublishedAt(LocalDateTime.now());
        }
        
        post = blogPostRepository.save(post);
        return convertToDTO(post);
    }
    
           public void deletePost(Long id, String authorEmail) {
               BlogPost post = blogPostRepository.findById(id)
                   .orElseThrow(() -> new RuntimeException("Post not found"));

               User user = userRepository.findByEmail(authorEmail)
                   .orElseThrow(() -> new RuntimeException("User not found"));

               // Check if user is admin or the post author
               boolean isAdmin = user.getRole() == Role.ADMIN;
               boolean isAuthor = post.getAuthor().getEmail().equals(authorEmail);

               if (!isAdmin && !isAuthor) {
                   throw new RuntimeException("Unauthorized to delete this post");
               }

               blogPostRepository.delete(post);
           }

           // Admin method to update post status
           public BlogPostDTO updatePostStatus(Long id, String status, String rejectionReason, String adminEmail) {
               try {
                   System.out.println("BlogService.updatePostStatus() called with id: " + id + ", status: " + status + ", adminEmail: " + adminEmail);
                   
                   BlogPost post = blogPostRepository.findById(id)
                       .orElseThrow(() -> new RuntimeException("Post not found with id: " + id));

                   System.out.println("Found post: " + post.getTitle() + " with current status: " + post.getStatus());

                   // Check if user is admin
                   User user = userRepository.findByEmail(adminEmail)
                       .orElseThrow(() -> new RuntimeException("User not found"));
                   
                   if (user.getRole() != Role.ADMIN) {
                       throw new RuntimeException("Only admin can update post status");
                   }

                   // Update status
                   try {
                       BlogPost.BlogPostStatus newStatus = BlogPost.BlogPostStatus.valueOf(status.toLowerCase());
                       System.out.println("Converting status '" + status + "' to enum: " + newStatus);
                       
                       post.setStatus(newStatus);
                       
                       // If approving, set published date
                       if (newStatus == BlogPost.BlogPostStatus.published && post.getPublishedAt() == null) {
                           post.setPublishedAt(LocalDateTime.now());
                           System.out.println("Set published date to: " + post.getPublishedAt());
                       }
                       
                       post = blogPostRepository.save(post);
                       System.out.println("Post saved successfully with new status: " + post.getStatus());
                       
                       BlogPostDTO dto = convertToDTO(post);
                       System.out.println("DTO created successfully for post: " + dto.getTitle());
                       return dto;
                   } catch (IllegalArgumentException e) {
                       System.err.println("Invalid status: " + status + ", error: " + e.getMessage());
                       throw new RuntimeException("Invalid status: " + status + ". Valid statuses are: draft, pending, published, rejected");
                   }
               } catch (Exception e) {
                   System.err.println("Error in updatePostStatus: " + e.getMessage());
                   e.printStackTrace();
                   throw e;
               }
           }
    
    // Like Methods
    public boolean toggleLike(Long postId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Optional<BlogLike> existingLike = blogLikeRepository.findByPostIdAndUserId(postId, user.getId());
        
        if (existingLike.isPresent()) {
            blogLikeRepository.delete(existingLike.get());
            updateLikeCount(postId);
            return false; // Unliked
        } else {
            BlogPost post = blogPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
            
            BlogLike like = new BlogLike();
            like.setPost(post);
            like.setUser(user);
            blogLikeRepository.save(like);
            updateLikeCount(postId);
            return true; // Liked
        }
    }
    
    public boolean isLikedByUser(Long postId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return blogLikeRepository.existsByPostIdAndUserId(postId, user.getId());
    }
    
    public boolean isBookmarkedByUser(Long postId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return blogBookmarkRepository.existsByPostIdAndUserId(postId, user.getId());
    }
    
    public boolean isSharedByUser(Long postId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return blogShareRepository.existsByPostIdAndUserId(postId, user.getId());
    }
    
    // Comment Methods
    public BlogCommentDTO createComment(Long postId, BlogCommentRequest request, String userEmail) {
        BlogPost post = blogPostRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        BlogComment comment = new BlogComment();
        comment.setPost(post);
        comment.setUser(user);
        comment.setContent(request.getContent());
        comment.setStatus(BlogComment.CommentStatus.approved); // Set status to approved
        
        if (request.getParentId() != null) {
            BlogComment parent = blogCommentRepository.findById(request.getParentId())
                .orElseThrow(() -> new RuntimeException("Parent comment not found"));
            comment.setParent(parent);
        }
        
        comment = blogCommentRepository.save(comment);
        
        // Set updatedAt to createdAt for new comments to ensure proper sorting
        if (comment.getUpdatedAt() == null) {
            comment.setUpdatedAt(comment.getCreatedAt());
            comment = blogCommentRepository.save(comment);
        }
        
        // Ensure updatedAt is not in the future (fix any data issues)
        LocalDateTime now = LocalDateTime.now();
        if (comment.getUpdatedAt().isAfter(now)) {
            System.out.println("Warning: Comment " + comment.getId() + " has future updatedAt, fixing to current time");
            comment.setUpdatedAt(now);
            comment = blogCommentRepository.save(comment);
        }
        
        updateCommentCount(postId);
        
        return convertCommentToDTO(comment);
    }
    
    public Page<BlogCommentDTO> getComments(Long postId, Pageable pageable) {
        try {
            System.out.println("BlogService.getComments() called with postId: " + postId);
            System.out.println("Using new sorting method: findByPostIdAndStatusOrderByUpdatedAtDesc");
            
            // Use native query to bypass JPA cache completely
            int pageNumber = pageable.getPageNumber();
            int pageSize = pageable.getPageSize();
            int offset = pageNumber * pageSize;
            
            List<BlogComment> commentList = blogCommentRepository.findCommentsByPostIdNative(
                postId, "approved", pageSize, offset);
            
            // Create a simple Page object
            Page<BlogComment> comments = new org.springframework.data.domain.PageImpl<>(
                commentList, pageable, commentList.size());
            System.out.println("BlogService.getComments() found " + comments.getTotalElements() + " comments");
            
            // Debug: Print comment order
            System.out.println("Comment order (by updatedAt):");
            for (BlogComment comment : comments.getContent()) {
                System.out.println("Comment ID: " + comment.getId() + 
                    ", createdAt: " + comment.getCreatedAt() + 
                    ", updatedAt: " + comment.getUpdatedAt());
            }
            
            return comments.map(this::convertCommentToDTO);
        } catch (Exception e) {
            System.err.println("Error in BlogService.getComments(): " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    public BlogCommentDTO updateComment(Long commentId, BlogCommentRequest request, String userEmail) {
        BlogComment comment = blogCommentRepository.findById(commentId)
            .orElseThrow(() -> new RuntimeException("Comment not found"));
        
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user is admin or the comment author
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean isAuthor = comment.getUser().getId().equals(user.getId());
        
        if (!isAdmin && !isAuthor) {
            throw new RuntimeException("You don't have permission to edit this comment");
        }
        
        // Update comment content
        comment.setContent(request.getContent());
        comment.setUpdatedAt(LocalDateTime.now());
        
        comment = blogCommentRepository.save(comment);
        
        return convertCommentToDTO(comment);
    }
    
    public void deleteComment(Long commentId, String userEmail) {
        BlogComment comment = blogCommentRepository.findById(commentId)
            .orElseThrow(() -> new RuntimeException("Comment not found"));
        
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user is admin or the comment author
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean isAuthor = comment.getUser().getId().equals(user.getId());
        
        if (!isAdmin && !isAuthor) {
            throw new RuntimeException("You don't have permission to delete this comment");
        }
        
        blogCommentRepository.delete(comment);
        
        // Update comment count for the post
        updateCommentCount(comment.getPost().getId());
    }
    
    // Share Methods
    public BlogShareDTO createShare(Long postId, BlogShareRequest request, String userEmail) {
        BlogPost post = blogPostRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        BlogShare share = new BlogShare();
        share.setPost(post);
        share.setUser(user);
        share.setPlatform(request.getPlatform());
        share.setSharedUrl(request.getSharedUrl());
        
        share = blogShareRepository.save(share);
        updateShareCount(postId);
        
        return convertShareToDTO(share);
    }
    
    // Bookmark Methods
    public boolean toggleBookmark(Long postId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Optional<BlogBookmark> existingBookmark = blogBookmarkRepository.findByPostIdAndUserId(postId, user.getId());
        
        if (existingBookmark.isPresent()) {
            blogBookmarkRepository.delete(existingBookmark.get());
            return false; // Unbookmarked
        } else {
            BlogPost post = blogPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
            
            BlogBookmark bookmark = new BlogBookmark();
            bookmark.setPost(post);
            bookmark.setUser(user);
            blogBookmarkRepository.save(bookmark);
            return true; // Bookmarked
        }
    }
    
    // View Methods
    public void recordView(Long postId, String userEmail, String ipAddress, String userAgent) {
        BlogPost post = blogPostRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        
        BlogPostView view = new BlogPostView();
        view.setPost(post);
        if (userEmail != null) {
            try {
                User user = userRepository.findByEmail(userEmail)
                    .orElse(null);
                view.setUser(user);
            } catch (Exception e) {
                // Ignore user not found error for anonymous users
                view.setUser(null);
            }
        }
        view.setIpAddress(ipAddress);
        view.setUserAgent(userAgent);
        
        blogPostViewRepository.save(view);
        updateViewCount(postId);
    }
    
    public void recordView(Long postId) {
        try {
            System.out.println("BlogService.recordView() called with postId: " + postId);
            
            BlogPost post = blogPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));
            
            System.out.println("Found post: " + post.getTitle());
            
            BlogPostView view = new BlogPostView();
            view.setPost(post);
            view.setUser(null);
            view.setIpAddress("127.0.0.1");
            view.setUserAgent("Unknown");
            
            System.out.println("Saving view...");
            blogPostViewRepository.save(view);
            System.out.println("View saved successfully");
            
            System.out.println("Updating view count...");
            updateViewCount(postId);
            System.out.println("View count updated successfully");
            
        } catch (Exception e) {
            System.err.println("Error in recordView: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to record view: " + e.getMessage(), e);
        }
    }
    
    // Category Methods
    public List<BlogCategoryDTO> getAllCategories() {
        List<BlogCategory> categories = blogCategoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
        return categories.stream().map(this::convertCategoryToDTO).collect(Collectors.toList());
    }
    
    // Tag Methods
    public List<BlogTagDTO> getAllTags() {
        List<BlogTag> tags = blogTagRepository.findAll();
        return tags.stream().map(this::convertTagToDTO).collect(Collectors.toList());
    }
    
    // Get comments for a blog post with pagination
    public Page<BlogCommentDTO> getCommentsByPostId(Long postId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending().and(Sort.by("createdAt").descending()));
        Page<BlogComment> comments = blogCommentRepository.findByPostIdAndStatusOrderByUpdatedAtDesc(postId, BlogComment.CommentStatus.approved, pageable);
        return comments.map(this::convertCommentToDTO);
    }
    
    // Helper Methods
    private String generateSlug(String title) {
        String baseSlug = title.toLowerCase()
            .replaceAll("[^a-z0-9\\s]", "")
            .replaceAll("\\s+", "-")
            .trim();
        
        // Ensure slug is not too long (MySQL limit)
        if (baseSlug.length() > 100) {
            baseSlug = baseSlug.substring(0, 100);
        }
        
        String slug = baseSlug;
        int counter = 1;
        
        // Check if slug already exists and append counter if needed
        while (blogPostRepository.existsBySlug(slug)) {
            String suffix = "-" + counter;
            if (baseSlug.length() + suffix.length() > 100) {
                baseSlug = baseSlug.substring(0, 100 - suffix.length());
            }
            slug = baseSlug + suffix;
            counter++;
        }
        
        return slug;
    }
    
    private void updateLikeCount(Long postId) {
        long count = blogLikeRepository.countByPostId(postId);
        BlogPost post = blogPostRepository.findById(postId).orElse(null);
        if (post != null) {
            post.setLikeCount((int) count);
            blogPostRepository.save(post);
        }
    }
    
    private void updateCommentCount(Long postId) {
        long count = blogCommentRepository.countByPostIdAndStatus(postId, BlogComment.CommentStatus.approved);
        BlogPost post = blogPostRepository.findById(postId).orElse(null);
        if (post != null) {
            post.setCommentCount((int) count);
            blogPostRepository.save(post);
        }
    }
    
    // Method to update comment count for all posts (for admin use)
    public void updateAllCommentCounts() {
        List<BlogPost> allPosts = blogPostRepository.findAll();
        for (BlogPost post : allPosts) {
            long count = blogCommentRepository.countByPostIdAndStatus(post.getId(), BlogComment.CommentStatus.approved);
            post.setCommentCount((int) count);
            blogPostRepository.save(post);
        }
    }
    
    private void updateShareCount(Long postId) {
        long count = blogShareRepository.countByPostId(postId);
        BlogPost post = blogPostRepository.findById(postId).orElse(null);
        if (post != null) {
            post.setShareCount((int) count);
            blogPostRepository.save(post);
        }
    }
    
    private void updateViewCount(Long postId) {
        long count = blogPostViewRepository.countByPostId(postId);
        BlogPost post = blogPostRepository.findById(postId).orElse(null);
        if (post != null) {
            post.setViewCount((int) count);
            blogPostRepository.save(post);
        }
    }
    
    // Conversion Methods
    private BlogPostDTO convertToDTO(BlogPost post) {
        return convertToDTO(post, null);
    }
    
    private BlogPostDTO convertToDTO(BlogPost post, String userEmail) {
        BlogPostDTO dto = new BlogPostDTO();
        dto.setId(post.getId());
        dto.setTitle(post.getTitle());
        dto.setSlug(post.getSlug());
        dto.setContent(post.getContent());
        dto.setExcerpt(post.getExcerpt());
        dto.setAuthorId(post.getAuthor().getId());
        dto.setAuthorName(post.getAuthor().getFirstName() + " " + post.getAuthor().getLastName());
        dto.setAuthorAvatar(post.getAuthor().getAvatarUrl());
        dto.setStatus(post.getStatus());
        
        // Fix featured image URL to include base URL
        String featuredImage = post.getFeaturedImage();
        if (featuredImage != null && !featuredImage.startsWith("http")) {
            // Add base URL for relative paths
            featuredImage = backendUrl + featuredImage;
        }
        dto.setFeaturedImage(featuredImage);
        
        dto.setViewCount(post.getViewCount());
        dto.setLikeCount(post.getLikeCount());
        dto.setCommentCount(post.getCommentCount());
        dto.setShareCount(post.getShareCount());
        dto.setIsFeatured(post.getIsFeatured());
        dto.setPublishedAt(post.getPublishedAt());
        dto.setCreatedAt(post.getCreatedAt());
        dto.setUpdatedAt(post.getUpdatedAt());
        
        // Set user interaction flags if user is provided
        if (userEmail != null) {
            dto.setIsLiked(isLikedByUser(post.getId(), userEmail));
            dto.setIsBookmarked(isBookmarkedByUser(post.getId(), userEmail));
            dto.setIsShared(isSharedByUser(post.getId(), userEmail));
        } else {
            // Set default values for unauthenticated users
            dto.setIsLiked(false);
            dto.setIsBookmarked(false);
            dto.setIsShared(false);
        }
        
        // Calculate reading time (assuming 200 words per minute)
        int wordCount = post.getContent().split("\\s+").length;
        dto.setReadingTime((wordCount / 200) + " min read");
        
        // Set short content (first 150 characters)
        dto.setShortContent(post.getContent().length() > 150 ? 
            post.getContent().substring(0, 150) + "..." : post.getContent());
        
        return dto;
    }
    
    private BlogCommentDTO convertCommentToDTO(BlogComment comment) {
        try {
            System.out.println("BlogService.convertCommentToDTO() called for comment ID: " + comment.getId());
            BlogCommentDTO dto = new BlogCommentDTO();
            dto.setId(comment.getId());
            dto.setPostId(comment.getPost().getId());
            dto.setUserId(comment.getUser().getId());
            dto.setUserName(comment.getUser().getFirstName() + " " + comment.getUser().getLastName());
            dto.setUserAvatar(comment.getUser().getAvatarUrl());
            dto.setUserEmail(comment.getUser().getEmail()); // Add user email
            dto.setParentId(comment.getParent() != null ? comment.getParent().getId() : null);
            dto.setContent(comment.getContent());
            dto.setStatus(comment.getStatus());
            dto.setLikeCount(comment.getLikeCount());
            dto.setCreatedAt(comment.getCreatedAt());
            dto.setUpdatedAt(comment.getUpdatedAt());
            System.out.println("BlogService.convertCommentToDTO() completed successfully for comment ID: " + comment.getId());
            return dto;
        } catch (Exception e) {
            System.err.println("Error in BlogService.convertCommentToDTO(): " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    private BlogCategoryDTO convertCategoryToDTO(BlogCategory category) {
        BlogCategoryDTO dto = new BlogCategoryDTO();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setSlug(category.getSlug());
        dto.setDescription(category.getDescription());
        dto.setColor(category.getColor());
        dto.setParentId(category.getParent() != null ? category.getParent().getId() : null);
        dto.setParentName(category.getParent() != null ? category.getParent().getName() : null);
        dto.setDisplayOrder(category.getDisplayOrder());
        dto.setIsActive(category.getIsActive());
        dto.setCreatedAt(category.getCreatedAt());
        dto.setUpdatedAt(category.getUpdatedAt());
        return dto;
    }
    
    private BlogTagDTO convertTagToDTO(BlogTag tag) {
        BlogTagDTO dto = new BlogTagDTO();
        dto.setId(tag.getId());
        dto.setName(tag.getName());
        dto.setSlug(tag.getSlug());
        dto.setDescription(tag.getDescription());
        dto.setColor(tag.getColor());
        dto.setCreatedAt(tag.getCreatedAt());
        dto.setUpdatedAt(tag.getUpdatedAt());
        return dto;
    }
    
    private BlogShareDTO convertShareToDTO(BlogShare share) {
        BlogShareDTO dto = new BlogShareDTO();
        dto.setId(share.getId());
        dto.setPostId(share.getPost().getId());
        dto.setUserId(share.getUser().getId());
        dto.setPlatform(share.getPlatform());
        dto.setSharedUrl(share.getSharedUrl());
        dto.setCreatedAt(share.getCreatedAt());
        return dto;
    }
}
