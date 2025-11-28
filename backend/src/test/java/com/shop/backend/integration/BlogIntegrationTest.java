package com.shop.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shop.backend.model.BlogPost;
import com.shop.backend.model.BlogCategory;
import com.shop.backend.model.User;
import com.shop.backend.model.Role;
import com.shop.backend.repository.BlogPostRepository;
import com.shop.backend.repository.BlogCategoryRepository;
import com.shop.backend.repository.UserRepository;
import com.shop.backend.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Transactional
class BlogIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private BlogPostRepository blogPostRepository;

    @Autowired
    private BlogCategoryRepository blogCategoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private User adminUser;
    private String userToken;
    private String adminToken;
    private BlogCategory testCategory;

    @BeforeEach
    void setUp() {
        // Create test user
        testUser = new User();
        testUser.setEmail("test@example.com");
        testUser.setPassword(passwordEncoder.encode("password123"));
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setRole(Role.STUDENT);
        testUser.setStatus(User.Status.ACTIVE);
        testUser = userRepository.save(testUser);
        userToken = jwtService.generateTokenWithUserInfo(testUser);

        // Create admin user
        adminUser = new User();
        adminUser.setEmail("admin@example.com");
        adminUser.setPassword(passwordEncoder.encode("password123"));
        adminUser.setFirstName("Admin");
        adminUser.setLastName("User");
        adminUser.setRole(Role.ADMIN);
        adminUser.setStatus(User.Status.ACTIVE);
        adminUser = userRepository.save(adminUser);
        adminToken = jwtService.generateTokenWithUserInfo(adminUser);

        // Create test category
        testCategory = new BlogCategory();
        testCategory.setName("Test Category");
        testCategory.setDescription("Test Description");
        testCategory = blogCategoryRepository.save(testCategory);
    }

    @Test
    void getPublicPosts_ShouldReturnOk() throws Exception {
        // Given - Create a published post
        BlogPost post = new BlogPost();
        post.setTitle("Test Post");
        post.setSlug("test-post");
        post.setContent("Test Content");
        post.setAuthor(testUser);
        post.setStatus(BlogPost.BlogPostStatus.published);
        blogPostRepository.save(post);

        // When & Then
        mockMvc.perform(get("/api/blog/posts/public")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].title").value("Test Post"));
    }

    @Test
    void createPost_AsAuthenticatedUser_ShouldCreatePost() throws Exception {
        // Given
        Map<String, Object> postData = new HashMap<>();
        postData.put("title", "New Post");
        postData.put("content", "Post Content");
        postData.put("categoryId", testCategory.getId());

        // When & Then
        mockMvc.perform(post("/api/blog/posts")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(postData)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("New Post"));
    }

    @Test
    void createPost_WithoutAuth_ShouldReturnUnauthorized() throws Exception {
        // Given
        Map<String, Object> postData = new HashMap<>();
        postData.put("title", "New Post");
        postData.put("content", "Post Content");

        // When & Then
        mockMvc.perform(post("/api/blog/posts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(postData)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updatePost_AsAuthor_ShouldUpdatePost() throws Exception {
        // Given - Create a post
        BlogPost post = new BlogPost();
        post.setTitle("Original Title");
        post.setSlug("original-title");
        post.setContent("Original Content");
        post.setAuthor(testUser);
        post.setStatus(BlogPost.BlogPostStatus.draft);
        post = blogPostRepository.save(post);

        Map<String, Object> updateData = new HashMap<>();
        updateData.put("title", "Updated Title");
        updateData.put("content", "Updated Content");

        // When & Then
        mockMvc.perform(put("/api/blog/posts/" + post.getId())
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateData)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Title"));
    }

    @Test
    void deletePost_AsAuthor_ShouldDeletePost() throws Exception {
        // Given - Create a post
        BlogPost post = new BlogPost();
        post.setTitle("To Delete");
        post.setSlug("to-delete");
        post.setContent("Content");
        post.setAuthor(testUser);
        post.setStatus(BlogPost.BlogPostStatus.draft);
        post = blogPostRepository.save(post);

        // When & Then
        mockMvc.perform(delete("/api/blog/posts/" + post.getId())
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk());

        // Verify post is deleted
        assert blogPostRepository.findById(post.getId()).isEmpty();
    }

    @Test
    void approvePost_AsAdmin_ShouldApprovePost() throws Exception {
        // Given - Create a pending post
        BlogPost post = new BlogPost();
        post.setTitle("Pending Post");
        post.setSlug("pending-post");
        post.setContent("Content");
        post.setAuthor(testUser);
        post.setStatus(BlogPost.BlogPostStatus.pending);
        post = blogPostRepository.save(post);

        // When & Then
        mockMvc.perform(put("/api/admin/blog/posts/" + post.getId() + "/approve")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("published"));
    }

    @Test
    void approvePost_AsNonAdmin_ShouldReturnForbidden() throws Exception {
        // Given - Create a pending post
        BlogPost post = new BlogPost();
        post.setTitle("Pending Post");
        post.setSlug("pending-post-2");
        post.setContent("Content");
        post.setAuthor(testUser);
        post.setStatus(BlogPost.BlogPostStatus.pending);
        post = blogPostRepository.save(post);

        // When & Then
        mockMvc.perform(put("/api/admin/blog/posts/" + post.getId() + "/approve")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }
}

