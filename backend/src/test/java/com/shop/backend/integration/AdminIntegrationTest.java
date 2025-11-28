package com.shop.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shop.backend.model.User;
import com.shop.backend.model.Role;
import com.shop.backend.model.SystemAnnouncement;
import com.shop.backend.repository.UserRepository;
import com.shop.backend.repository.SystemAnnouncementRepository;
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

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Transactional
class AdminIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SystemAnnouncementRepository announcementRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private User adminUser;
    private User studentUser;
    private String adminToken;
    private String studentToken;
    private SystemAnnouncement testAnnouncement;

    @BeforeEach
    void setUp() {
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

        // Create student user
        studentUser = new User();
        studentUser.setEmail("student@example.com");
        studentUser.setPassword(passwordEncoder.encode("password123"));
        studentUser.setFirstName("Student");
        studentUser.setLastName("User");
        studentUser.setRole(Role.STUDENT);
        studentUser.setStatus(User.Status.ACTIVE);
        studentUser = userRepository.save(studentUser);
        studentToken = jwtService.generateTokenWithUserInfo(studentUser);

        // Create test announcement
        testAnnouncement = new SystemAnnouncement();
        testAnnouncement.setTitle("Test Announcement");
        testAnnouncement.setContent("Test content");
        testAnnouncement.setIsActive(true);
        testAnnouncement.setCreatedAt(LocalDateTime.now());
        testAnnouncement = announcementRepository.save(testAnnouncement);
    }

    @Test
    void testGetUsersRequiresAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetUsersWithAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testGetUsersByRole() throws Exception {
        mockMvc.perform(get("/api/admin/users/role/STUDENT")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testUpdateUserStatusRequiresAdminRole() throws Exception {
        Map<String, String> statusUpdate = new HashMap<>();
        statusUpdate.put("status", "INACTIVE");

        mockMvc.perform(put("/api/admin/users/" + studentUser.getId() + "/status")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusUpdate)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUpdateUserStatusWithAdminRole() throws Exception {
        Map<String, String> statusUpdate = new HashMap<>();
        statusUpdate.put("status", "INACTIVE");

        mockMvc.perform(put("/api/admin/users/" + studentUser.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusUpdate)))
                .andExpect(status().isOk());
    }

    @Test
    void testUpdateUserRoleRequiresAdminRole() throws Exception {
        Map<String, String> roleUpdate = new HashMap<>();
        roleUpdate.put("role", "EXPERT");

        mockMvc.perform(put("/api/admin/users/" + studentUser.getId() + "/role")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roleUpdate)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUpdateUserRoleWithAdminRole() throws Exception {
        Map<String, String> roleUpdate = new HashMap<>();
        roleUpdate.put("role", "EXPERT");

        mockMvc.perform(put("/api/admin/users/" + studentUser.getId() + "/role")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roleUpdate)))
                .andExpect(status().isOk());
    }

    @Test
    void testGetQuestionsRequiresAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/questions")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetQuestionsWithAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/questions")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testGetAnnouncementsRequiresAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/announcements")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetAnnouncementsWithAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/announcements")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testCreateAnnouncementRequiresAdminRole() throws Exception {
        Map<String, Object> announcement = new HashMap<>();
        announcement.put("title", "New Announcement");
        announcement.put("content", "Content");

        mockMvc.perform(post("/api/admin/announcements")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(announcement)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testCreateAnnouncementWithAdminRole() throws Exception {
        Map<String, Object> announcement = new HashMap<>();
        announcement.put("title", "New Announcement");
        announcement.put("content", "Content");
        announcement.put("isActive", true);

        try {
            mockMvc.perform(post("/api/admin/announcements")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(announcement)))
                    .andExpect(status().isOk());
        } catch (Exception e) {
            mockMvc.perform(post("/api/admin/announcements")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(announcement)))
                    .andExpect(status().isCreated());
        }
    }

    @Test
    void testUpdateAnnouncementRequiresAdminRole() throws Exception {
        Map<String, Object> announcement = new HashMap<>();
        announcement.put("title", "Updated Title");

        mockMvc.perform(put("/api/admin/announcements/" + testAnnouncement.getId())
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(announcement)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testDeleteAnnouncementRequiresAdminRole() throws Exception {
        mockMvc.perform(delete("/api/admin/announcements/" + testAnnouncement.getId())
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetStatisticsRequiresAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/statistics")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetStatisticsWithAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/statistics")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void testGetRecentTestResultsRequiresAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/test-results/recent")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetRecentTestResultsWithAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/test-results/recent")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}

