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
import java.util.ArrayList;
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
    
    @Autowired
    private BlogReportRepository blogReportRepository;
    
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
        // If user is logged in, include their pending posts
        if (userEmail != null) {
            User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user != null) {
                // Get all published posts (larger page size to combine with pending)
                Pageable largerPageable = PageRequest.of(0, pageable.getPageSize() * 10, pageable.getSort());
                Page<BlogPost> publishedPosts = blogPostRepository.findByStatusOrderByPublishedAtDesc(
                    BlogPost.BlogPostStatus.published, largerPageable);
                
                // Get all pending posts of this user
                Pageable pendingPageable = PageRequest.of(0, 100, Sort.by("createdAt").descending());
                Page<BlogPost> userPendingPosts = blogPostRepository.findByAuthorIdAndStatus(
                    user.getId(), BlogPost.BlogPostStatus.pending, pendingPageable);
                
                // Combine published posts with user's pending posts
                List<BlogPost> allPosts = new ArrayList<>();
                allPosts.addAll(publishedPosts.getContent());
                allPosts.addAll(userPendingPosts.getContent());
                
                // Remove duplicates (in case a post is both published and pending - shouldn't happen but safety)
                allPosts = allPosts.stream()
                    .distinct()
                    .collect(Collectors.toList());
                
                // Sort by date descending (publishedAt for published, createdAt for pending)
                allPosts.sort((a, b) -> {
                    LocalDateTime dateA = a.getPublishedAt() != null ? a.getPublishedAt() : a.getCreatedAt();
                    LocalDateTime dateB = b.getPublishedAt() != null ? b.getPublishedAt() : b.getCreatedAt();
                    return dateB.compareTo(dateA);
                });
                
                // Apply pagination
                int start = (int) pageable.getOffset();
                int end = Math.min((start + pageable.getPageSize()), allPosts.size());
                List<BlogPost> paginatedPosts = start < allPosts.size() 
                    ? allPosts.subList(start, end)
                    : new ArrayList<>();
                
                return new org.springframework.data.domain.PageImpl<>(
                    paginatedPosts.stream().map(post -> convertToDTO(post, userEmail)).collect(Collectors.toList()),
                    pageable,
                    allPosts.size()
                );
            }
        }
        
        // For non-logged in users, return only published posts
        Page<BlogPost> publishedPosts = blogPostRepository.findByStatusOrderByPublishedAtDesc(
            BlogPost.BlogPostStatus.published, pageable);
        return publishedPosts.map(post -> convertToDTO(post, userEmail));
    }

    // Admin method to get all posts (including pending, draft, etc.)
    public Page<BlogPostDTO> getAllPostsForAdmin(Pageable pageable, String userEmail) {
        Page<BlogPost> posts = blogPostRepository.findAll(pageable);
        return posts.map(post -> convertToDTO(post, userEmail));
    }
    
    public Page<BlogPostDTO> getAllPostsForAdmin(BlogPost.BlogPostStatus status, Pageable pageable, String userEmail) {
        Page<BlogPost> posts;
        if (status != null) {
            posts = blogPostRepository.findByStatus(status, pageable);
        } else {
            posts = blogPostRepository.findAll(pageable);
        }
        return posts.map(post -> convertToDTO(post, userEmail));
    }
    
    public Page<BlogPostDTO> getPendingPosts(Pageable pageable, String userEmail) {
        Page<BlogPost> posts = blogPostRepository.findByStatus(
            BlogPost.BlogPostStatus.pending, pageable);
        return posts.map(post -> convertToDTO(post, userEmail));
    }
    
    public BlogPostDTO approvePost(Long id, String adminEmail) {
        BlogPost post = blogPostRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        
        post.setStatus(BlogPost.BlogPostStatus.published);
        if (post.getPublishedAt() == null) {
            post.setPublishedAt(LocalDateTime.now());
        }
        
        post = blogPostRepository.save(post);
        return convertToDTO(post);
    }
    
    public BlogPostDTO rejectPost(Long id, String reason, String adminEmail) {
        BlogPost post = blogPostRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        
        post.setStatus(BlogPost.BlogPostStatus.rejected);
        post = blogPostRepository.save(post);
        return convertToDTO(post);
    }
    
    public BlogPostDTO publishPost(Long id, String adminEmail) {
        BlogPost post = blogPostRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        
        post.setStatus(BlogPost.BlogPostStatus.published);
        if (post.getPublishedAt() == null) {
            post.setPublishedAt(LocalDateTime.now());
        }
        
        post = blogPostRepository.save(post);
        return convertToDTO(post);
    }
    
    public BlogPostDTO unpublishPost(Long id, String adminEmail) {
        BlogPost post = blogPostRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        
        post.setStatus(BlogPost.BlogPostStatus.draft);
        post = blogPostRepository.save(post);
        return convertToDTO(post);
    }
    
    public void deletePostByAdmin(Long id, String adminEmail) {
        BlogPost post = blogPostRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        blogPostRepository.delete(post);
    }
    
    // Advanced filtering and search
    public Page<BlogPostDTO> searchPostsAdvanced(
            String keyword,
            List<Long> categoryIds,
            List<Long> tagIds,
            BlogPost.BlogPostStatus status,
            Long authorId,
            Boolean isFeatured,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable,
            String userEmail) {
        
        Page<BlogPost> posts;
        
        // Build query based on filters
        BlogPost.BlogPostStatus filterStatus = status != null ? status : BlogPost.BlogPostStatus.published;
        
        if (keyword != null && !keyword.trim().isEmpty()) {
            posts = blogPostRepository.searchPosts(filterStatus, keyword.trim(), pageable);
        } else if (categoryIds != null && !categoryIds.isEmpty() && tagIds != null && !tagIds.isEmpty()) {
            // Both category and tag filters - get all posts and filter in memory
            posts = blogPostRepository.findByStatus(filterStatus, pageable);
        } else if (categoryIds != null && !categoryIds.isEmpty()) {
            // Filter by multiple categories
            posts = blogPostRepository.findByCategoryIdsAndStatus(categoryIds, filterStatus, pageable);
        } else if (tagIds != null && !tagIds.isEmpty()) {
            // Filter by multiple tags
            posts = blogPostRepository.findByTagIdsAndStatus(tagIds, filterStatus, pageable);
        } else if (status != null) {
            posts = blogPostRepository.findByStatus(status, pageable);
        } else {
            posts = blogPostRepository.findAll(pageable);
        }
        
        // Convert to DTOs and apply additional filters
        List<BlogPostDTO> filteredDTOs = posts.stream()
            .map(post -> convertToDTO(post, userEmail))
            .filter(dto -> {
                // Apply additional filters
                if (categoryIds != null && !categoryIds.isEmpty() && dto.getCategories() != null) {
                    boolean hasCategory = dto.getCategories().stream()
                        .anyMatch(c -> categoryIds.contains(c.getId()));
                    if (!hasCategory) {
                        return false;
                    }
                }
                
                if (tagIds != null && !tagIds.isEmpty() && dto.getTags() != null) {
                    boolean hasTag = dto.getTags().stream()
                        .anyMatch(t -> tagIds.contains(t.getId()));
                    if (!hasTag) {
                        return false;
                    }
                }
                
                if (authorId != null && !dto.getAuthorId().equals(authorId)) {
                    return false;
                }
                
                if (isFeatured != null && !isFeatured.equals(dto.getIsFeatured())) {
                    return false;
                }
                
                if (startDate != null && dto.getPublishedAt() != null && dto.getPublishedAt().isBefore(startDate)) {
                    return false;
                }
                
                if (endDate != null && dto.getPublishedAt() != null && dto.getPublishedAt().isAfter(endDate)) {
                    return false;
                }
                
                return true;
            })
            .collect(Collectors.toList());
        
        // Create a new Page from filtered results
        return new org.springframework.data.domain.PageImpl<>(
            filteredDTOs,
            pageable,
            filteredDTOs.size());
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
        
        // Update categories
        if (request.getCategoryIds() != null) {
            // Remove existing categories
            blogPostCategoryRepository.deleteByPostId(id);
            
            // Add new categories
            for (Long categoryId : request.getCategoryIds()) {
                BlogCategory category = blogCategoryRepository.findById(categoryId)
                    .orElseThrow(() -> new RuntimeException("Category not found: " + categoryId));
                BlogPostCategory postCategory = new BlogPostCategory();
                postCategory.setPost(post);
                postCategory.setCategory(category);
                blogPostCategoryRepository.save(postCategory);
            }
        }
        
        // Update tags
        if (request.getTagIds() != null) {
            // Remove existing tags
            blogPostTagRepository.deleteByPostId(id);
            
            // Add new tags
            for (Long tagId : request.getTagIds()) {
                BlogTag tag = blogTagRepository.findById(tagId)
                    .orElseThrow(() -> new RuntimeException("Tag not found: " + tagId));
                BlogPostTag postTag = new BlogPostTag();
                postTag.setPost(post);
                postTag.setTag(tag);
                blogPostTagRepository.save(postTag);
            }
        }
        
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
    
    public Page<BlogPostDTO> getMyBookmarks(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Page<BlogBookmark> bookmarks = blogBookmarkRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
        
        return bookmarks.map(bookmark -> {
            BlogPostDTO dto = convertToDTO(bookmark.getPost(), userEmail);
            // Set bookmark created date if needed in the future
            return dto;
        });
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
    
    public BlogCategoryDTO createCategory(BlogCategoryRequest request) {
        BlogCategory category = new BlogCategory();
        category.setName(request.getName());
        category.setSlug(generateSlugFromName(request.getName(), true));
        category.setDescription(request.getDescription());
        category.setColor(request.getColor() != null ? request.getColor() : "#10B981");
        category.setDisplayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0);
        category.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        
        if (request.getParentId() != null) {
            BlogCategory parent = blogCategoryRepository.findById(request.getParentId())
                .orElseThrow(() -> new RuntimeException("Parent category not found"));
            category.setParent(parent);
        }
        
        category = blogCategoryRepository.save(category);
        return convertCategoryToDTO(category);
    }
    
    public BlogCategoryDTO updateCategory(Long id, BlogCategoryRequest request) {
        BlogCategory category = blogCategoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found"));
        
        if (!category.getName().equals(request.getName())) {
            category.setName(request.getName());
            category.setSlug(generateSlugFromName(request.getName(), true, id));
        }
        
        category.setDescription(request.getDescription());
        if (request.getColor() != null) {
            category.setColor(request.getColor());
        }
        if (request.getDisplayOrder() != null) {
            category.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getIsActive() != null) {
            category.setIsActive(request.getIsActive());
        }
        
        if (request.getParentId() != null) {
            if (request.getParentId().equals(id)) {
                throw new RuntimeException("Category cannot be its own parent");
            }
            BlogCategory parent = blogCategoryRepository.findById(request.getParentId())
                .orElseThrow(() -> new RuntimeException("Parent category not found"));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }
        
        category = blogCategoryRepository.save(category);
        return convertCategoryToDTO(category);
    }
    
    public void deleteCategory(Long id) {
        BlogCategory category = blogCategoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found"));
        
        // Check if category has posts
        List<BlogPostCategory> postCategories = blogPostCategoryRepository.findByCategoryId(id);
        if (!postCategories.isEmpty()) {
            throw new RuntimeException("Cannot delete category with associated posts");
        }
        
        // Check if category has children
        List<BlogCategory> children = blogCategoryRepository.findByParentIdAndIsActiveTrueOrderByDisplayOrderAsc(id);
        if (!children.isEmpty()) {
            throw new RuntimeException("Cannot delete category with child categories");
        }
        
        blogCategoryRepository.delete(category);
    }
    
    // Tag Methods
    public List<BlogTagDTO> getAllTags() {
        List<BlogTag> tags = blogTagRepository.findAll();
        return tags.stream().map(this::convertTagToDTO).collect(Collectors.toList());
    }
    
    public BlogTagDTO createTag(BlogTagRequest request) {
        // Check if tag with same name already exists
        Optional<BlogTag> existingTag = blogTagRepository.findByNameIgnoreCase(request.getName());
        if (existingTag.isPresent()) {
            return convertTagToDTO(existingTag.get());
        }
        
        BlogTag tag = new BlogTag();
        tag.setName(request.getName());
        tag.setSlug(generateSlugFromName(request.getName(), false));
        tag.setDescription(request.getDescription());
        tag.setColor(request.getColor() != null ? request.getColor() : "#3B82F6");
        
        tag = blogTagRepository.save(tag);
        return convertTagToDTO(tag);
    }
    
    public BlogTagDTO updateTag(Long id, BlogTagRequest request) {
        BlogTag tag = blogTagRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Tag not found"));
        
        if (!tag.getName().equals(request.getName())) {
            // Check if another tag with same name exists
            Optional<BlogTag> existingTag = blogTagRepository.findByNameIgnoreCase(request.getName());
            if (existingTag.isPresent() && !existingTag.get().getId().equals(id)) {
                throw new RuntimeException("Tag with this name already exists");
            }
            tag.setName(request.getName());
            tag.setSlug(generateSlugFromName(request.getName(), false, id));
        }
        
        tag.setDescription(request.getDescription());
        if (request.getColor() != null) {
            tag.setColor(request.getColor());
        }
        
        tag = blogTagRepository.save(tag);
        return convertTagToDTO(tag);
    }
    
    public void deleteTag(Long id) {
        BlogTag tag = blogTagRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Tag not found"));
        
        // Check if tag has posts
        List<BlogPostTag> postTags = blogPostTagRepository.findByTagId(id);
        if (!postTags.isEmpty()) {
            throw new RuntimeException("Cannot delete tag with associated posts");
        }
        
        blogTagRepository.delete(tag);
    }
    
    public List<BlogTagDTO> getPopularTags(int limit) {
        List<BlogTag> tags = blogTagRepository.findMostPopularTags();
        return tags.stream()
            .limit(limit)
            .map(this::convertTagToDTO)
            .collect(Collectors.toList());
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
    
    private String generateSlugFromName(String name, boolean isCategory) {
        return generateSlugFromName(name, isCategory, null);
    }
    
    private String generateSlugFromName(String name, boolean isCategory, Long excludeId) {
        String baseSlug = name.toLowerCase()
            .replaceAll("[^a-z0-9\\s]", "")
            .replaceAll("\\s+", "-")
            .trim();
        
        // Ensure slug is not too long (MySQL limit)
        if (baseSlug.length() > 100) {
            baseSlug = baseSlug.substring(0, 100);
        }
        
        String slug = baseSlug;
        int counter = 1;
        
        // Check if slug already exists
        boolean exists;
        if (isCategory) {
            exists = excludeId != null 
                ? blogCategoryRepository.existsBySlugAndIdNot(slug, excludeId)
                : blogCategoryRepository.existsBySlug(slug);
        } else {
            exists = excludeId != null
                ? blogTagRepository.existsBySlugAndIdNot(slug, excludeId)
                : blogTagRepository.existsBySlug(slug);
        }
        
        while (exists) {
            String suffix = "-" + counter;
            if (baseSlug.length() + suffix.length() > 100) {
                baseSlug = baseSlug.substring(0, 100 - suffix.length());
            }
            slug = baseSlug + suffix;
            exists = isCategory
                ? (excludeId != null 
                    ? blogCategoryRepository.existsBySlugAndIdNot(slug, excludeId)
                    : blogCategoryRepository.existsBySlug(slug))
                : (excludeId != null
                    ? blogTagRepository.existsBySlugAndIdNot(slug, excludeId)
                    : blogTagRepository.existsBySlug(slug));
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
        dto.setAuthorEmail(post.getAuthor().getEmail()); // Add author email for frontend comparison
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
        
        // Set categories
        List<BlogPostCategory> postCategories = blogPostCategoryRepository.findByPostId(post.getId());
        List<BlogCategoryDTO> categoryDTOs = postCategories.stream()
            .map(pc -> convertCategoryToDTO(pc.getCategory()))
            .collect(Collectors.toList());
        dto.setCategories(categoryDTOs);
        
        // Set tags
        List<BlogPostTag> postTags = blogPostTagRepository.findByPostId(post.getId());
        List<BlogTagDTO> tagDTOs = postTags.stream()
            .map(pt -> convertTagToDTO(pt.getTag()))
            .collect(Collectors.toList());
        dto.setTags(tagDTOs);
        
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
    
    // Report Methods
    public BlogReportDTO createReport(Long postId, BlogReportRequest request, String userEmail) {
        BlogPost post = blogPostRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user already reported this post
        if (blogReportRepository.existsByPostIdAndUserId(postId, user.getId())) {
            throw new RuntimeException("You have already reported this post");
        }
        
        BlogReport report = new BlogReport();
        report.setPost(post);
        report.setUser(user);
        report.setReason(request.getReason());
        report.setDescription(request.getDescription());
        report.setStatus(BlogReport.ReportStatus.PENDING);
        
        report = blogReportRepository.save(report);
        return convertReportToDTO(report);
    }
    
    public Page<BlogReportDTO> getAllReportsForAdmin(BlogReport.ReportStatus status, Pageable pageable, String adminEmail) {
        try {
            Page<BlogReport> reports;
            if (status != null) {
                reports = blogReportRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
            } else {
                // Use PageRequest with Sort
                org.springframework.data.domain.PageRequest pageRequest = org.springframework.data.domain.PageRequest.of(
                    pageable.getPageNumber(),
                    pageable.getPageSize(),
                    org.springframework.data.domain.Sort.by("createdAt").descending()
                );
                reports = blogReportRepository.findAll(pageRequest);
            }
            // Ensure post and user are loaded before mapping
            List<BlogReport> reportList = reports.getContent();
            for (BlogReport report : reportList) {
                // Force load lazy associations
                if (report.getPost() != null) {
                    report.getPost().getId();
                    report.getPost().getTitle();
                }
                if (report.getUser() != null) {
                    report.getUser().getId();
                    report.getUser().getFirstName();
                    report.getUser().getLastName();
                }
            }
            return reports.map(this::convertReportToDTO);
        } catch (Exception e) {
            System.err.println("Error in getAllReportsForAdmin: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    public Page<BlogReportDTO> getPendingReports(Pageable pageable, String adminEmail) {
        try {
            Page<BlogReport> reports = blogReportRepository.findByStatusOrderByCreatedAtDesc(
                BlogReport.ReportStatus.PENDING, pageable);
            // Ensure post and user are loaded before mapping
            List<BlogReport> reportList = reports.getContent();
            for (BlogReport report : reportList) {
                // Force load lazy associations
                if (report.getPost() != null) {
                    report.getPost().getId();
                    report.getPost().getTitle();
                }
                if (report.getUser() != null) {
                    report.getUser().getId();
                    report.getUser().getFirstName();
                    report.getUser().getLastName();
                }
            }
            return reports.map(this::convertReportToDTO);
        } catch (Exception e) {
            System.err.println("Error in getPendingReports: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    public BlogReportDTO reviewReport(Long id, BlogReport.ReportStatus status, String adminNotes, String adminEmail) {
        BlogReport report = blogReportRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Report not found"));
        
        report.setStatus(status);
        if (adminNotes != null && !adminNotes.trim().isEmpty()) {
            report.setAdminNotes(adminNotes);
        }
        
        report = blogReportRepository.save(report);
        return convertReportToDTO(report);
    }
    
    public boolean hasUserReportedPost(Long postId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return blogReportRepository.existsByPostIdAndUserId(postId, user.getId());
    }
    
    private BlogReportDTO convertReportToDTO(BlogReport report) {
        try {
            BlogReportDTO dto = new BlogReportDTO();
            dto.setId(report.getId());
            
            // Safely access post
            if (report.getPost() != null) {
                dto.setPostId(report.getPost().getId());
                dto.setPostTitle(report.getPost().getTitle() != null ? report.getPost().getTitle() : "N/A");
            } else {
                dto.setPostId(null);
                dto.setPostTitle("N/A");
            }
            
            // Safely access user
            if (report.getUser() != null) {
                dto.setUserId(report.getUser().getId());
                String firstName = report.getUser().getFirstName() != null ? report.getUser().getFirstName() : "";
                String lastName = report.getUser().getLastName() != null ? report.getUser().getLastName() : "";
                String fullName = (firstName + " " + lastName).trim();
                dto.setUserName(fullName.isEmpty() ? "Unknown" : fullName);
            } else {
                dto.setUserId(null);
                dto.setUserName("Unknown");
            }
            
            dto.setReason(report.getReason());
            dto.setDescription(report.getDescription());
            dto.setStatus(report.getStatus());
            dto.setAdminNotes(report.getAdminNotes());
            dto.setCreatedAt(report.getCreatedAt());
            dto.setUpdatedAt(report.getUpdatedAt());
            return dto;
        } catch (Exception e) {
            System.err.println("Error converting BlogReport to DTO: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error converting report to DTO: " + e.getMessage(), e);
        }
    }
    
    // Blog Statistics
    public BlogStatsDTO getBlogStats() {
        try {
            BlogStatsDTO stats = new BlogStatsDTO();
            
            // Post counts
            stats.setTotalPosts(blogPostRepository.count());
            stats.setPublishedPosts(blogPostRepository.countByStatus(BlogPost.BlogPostStatus.published));
            stats.setPendingPosts(blogPostRepository.countByStatus(BlogPost.BlogPostStatus.pending));
            stats.setDraftPosts(blogPostRepository.countByStatus(BlogPost.BlogPostStatus.draft));
            
            // Comment counts
            long totalComments = blogCommentRepository.count();
            stats.setTotalComments(totalComments);
            // Assuming pending comments are those not yet approved (if you have approval system)
            stats.setPendingComments(0L); // Update if you have comment approval system
            
            // Like, Share, View counts
            stats.setTotalLikes(blogLikeRepository.count());
            stats.setTotalShares(blogShareRepository.count());
            stats.setTotalViews(blogPostViewRepository.count());
            
            // Report counts
            long totalReports = blogReportRepository.count();
            stats.setTotalReports(totalReports);
            stats.setPendingReports(blogReportRepository.countByStatus(BlogReport.ReportStatus.PENDING));
            
            // Category and Tag counts
            stats.setTotalCategories(blogCategoryRepository.count());
            stats.setTotalTags(blogTagRepository.count());
            
            // Recent activity (this week)
            LocalDateTime weekAgo = LocalDateTime.now().minusWeeks(1);
            long postsThisWeek = blogPostRepository.findAll().stream()
                .filter(post -> post.getCreatedAt() != null && post.getCreatedAt().isAfter(weekAgo))
                .count();
            stats.setPostsThisWeek(postsThisWeek);
            
            long commentsThisWeek = blogCommentRepository.findAll().stream()
                .filter(comment -> comment.getCreatedAt() != null && comment.getCreatedAt().isAfter(weekAgo))
                .count();
            stats.setCommentsThisWeek(commentsThisWeek);
            
            long viewsThisWeek = blogPostViewRepository.findAll().stream()
                .filter(view -> view.getViewedAt() != null && view.getViewedAt().isAfter(weekAgo))
                .count();
            stats.setViewsThisWeek(viewsThisWeek);
            
            // Most popular post (by view count)
            BlogPost mostViewedPost = blogPostRepository.findAll().stream()
                .max((p1, p2) -> Integer.compare(
                    p1.getViewCount() != null ? p1.getViewCount() : 0,
                    p2.getViewCount() != null ? p2.getViewCount() : 0
                ))
                .orElse(null);
            if (mostViewedPost != null && mostViewedPost.getTitle() != null) {
                stats.setMostPopularPost(mostViewedPost.getTitle());
            } else {
                stats.setMostPopularPost("N/A");
            }
            
            // Most active author (by post count)
            User mostActiveAuthor = blogPostRepository.findAll().stream()
                .filter(post -> post.getAuthor() != null)
                .collect(Collectors.groupingBy(BlogPost::getAuthor, Collectors.counting()))
                .entrySet().stream()
                .max((e1, e2) -> Long.compare(e1.getValue(), e2.getValue()))
                .map(entry -> entry.getKey())
                .orElse(null);
            if (mostActiveAuthor != null) {
                String firstName = mostActiveAuthor.getFirstName() != null ? mostActiveAuthor.getFirstName() : "";
                String lastName = mostActiveAuthor.getLastName() != null ? mostActiveAuthor.getLastName() : "";
                String fullName = (firstName + " " + lastName).trim();
                stats.setMostActiveAuthor(fullName.isEmpty() ? "Unknown" : fullName);
            } else {
                stats.setMostActiveAuthor("N/A");
            }
            
            // Most used category
            BlogCategory mostUsedCategory = blogPostCategoryRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                    pc -> pc.getCategory(),
                    Collectors.counting()
                ))
                .entrySet().stream()
                .max((e1, e2) -> Long.compare(e1.getValue(), e2.getValue()))
                .map(entry -> entry.getKey())
                .orElse(null);
            if (mostUsedCategory != null && mostUsedCategory.getName() != null) {
                stats.setMostUsedCategory(mostUsedCategory.getName());
            } else {
                stats.setMostUsedCategory("N/A");
            }
            
            // Most used tag
            BlogTag mostUsedTag = blogPostTagRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                    pt -> pt.getTag(),
                    Collectors.counting()
                ))
                .entrySet().stream()
                .max((e1, e2) -> Long.compare(e1.getValue(), e2.getValue()))
                .map(entry -> entry.getKey())
                .orElse(null);
            if (mostUsedTag != null && mostUsedTag.getName() != null) {
                stats.setMostUsedTag(mostUsedTag.getName());
            } else {
                stats.setMostUsedTag("N/A");
            }
            
            return stats;
        } catch (Exception e) {
            System.err.println("Error calculating blog stats: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error calculating blog stats: " + e.getMessage(), e);
        }
    }
}
