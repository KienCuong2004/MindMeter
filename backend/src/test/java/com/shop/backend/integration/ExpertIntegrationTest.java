package com.shop.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shop.backend.model.User;
import com.shop.backend.model.Role;
import com.shop.backend.model.DepressionTestResult;
import com.shop.backend.repository.UserRepository;
import com.shop.backend.repository.DepressionTestResultRepository;
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
class ExpertIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepressionTestResultRepository testResultRepository;


    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private User expertUser;
    private User studentUser;
    private String expertToken;
    private String studentToken;
    private DepressionTestResult testResult;

    @BeforeEach
    void setUp() {
        // Create expert user
        expertUser = new User();
        expertUser.setEmail("expert@example.com");
        expertUser.setPassword(passwordEncoder.encode("password123"));
        expertUser.setFirstName("Expert");
        expertUser.setLastName("User");
        expertUser.setRole(Role.EXPERT);
        expertUser.setStatus(User.Status.ACTIVE);
        expertUser = userRepository.save(expertUser);
        expertToken = jwtService.generateTokenWithUserInfo(expertUser);

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

        // Create test result for student
        testResult = new DepressionTestResult();
        testResult.setUser(studentUser);
        testResult.setTestType("PHQ9");
        testResult.setTotalScore(15);
        testResult.setSeverityLevel(DepressionTestResult.SeverityLevel.MODERATE);
        testResult.setTestedAt(LocalDateTime.now());
        testResult.setDiagnosis("Moderate depression");
        testResult.setRecommendation("Seek professional help");
        testResult = testResultRepository.save(testResult);
    }

    @Test
    void testGetTestResultsRequiresExpertRole() throws Exception {
        mockMvc.perform(get("/api/expert/test-results")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetTestResultsWithExpertRole() throws Exception {
        mockMvc.perform(get("/api/expert/test-results")
                        .header("Authorization", "Bearer " + expertToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testGetTestResultsBySeverity() throws Exception {
        mockMvc.perform(get("/api/expert/test-results/severity/MODERATE")
                        .header("Authorization", "Bearer " + expertToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testGetStudentTestHistory() throws Exception {
        mockMvc.perform(get("/api/expert/student/" + studentUser.getId() + "/test-history")
                        .header("Authorization", "Bearer " + expertToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testGetStudentTestHistoryRequiresExpertRole() throws Exception {
        mockMvc.perform(get("/api/expert/student/" + studentUser.getId() + "/test-history")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testAddNoteRequiresExpertRole() throws Exception {
        Map<String, Object> noteRequest = new HashMap<>();
        noteRequest.put("studentId", studentUser.getId());
        noteRequest.put("note", "Test note");

        mockMvc.perform(post("/api/expert/notes")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(noteRequest)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testAddNoteWithExpertRole() throws Exception {
        Map<String, Object> noteRequest = new HashMap<>();
        noteRequest.put("studentId", studentUser.getId());
        noteRequest.put("note", "Test note from expert");

        try {
            mockMvc.perform(post("/api/expert/notes")
                            .header("Authorization", "Bearer " + expertToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(noteRequest)))
                    .andExpect(status().isOk());
        } catch (Exception e) {
            mockMvc.perform(post("/api/expert/notes")
                            .header("Authorization", "Bearer " + expertToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(noteRequest)))
                    .andExpect(status().isCreated());
        }
    }

    @Test
    void testGetNotesRequiresExpertRole() throws Exception {
        mockMvc.perform(get("/api/expert/notes")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetNotesWithExpertRole() throws Exception {
        mockMvc.perform(get("/api/expert/notes")
                        .header("Authorization", "Bearer " + expertToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testGetStudentNotes() throws Exception {
        mockMvc.perform(get("/api/expert/student/" + studentUser.getId() + "/notes")
                        .header("Authorization", "Bearer " + expertToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testGetStatisticsRequiresExpertRole() throws Exception {
        mockMvc.perform(get("/api/expert/statistics")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetStatisticsWithExpertRole() throws Exception {
        mockMvc.perform(get("/api/expert/statistics")
                        .header("Authorization", "Bearer " + expertToken))
                .andExpect(status().isOk());
    }

    @Test
    void testGetProfileRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/expert/profile"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetProfileWithExpertRole() throws Exception {
        mockMvc.perform(get("/api/expert/profile")
                        .header("Authorization", "Bearer " + expertToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(expertUser.getEmail()));
    }

    @Test
    void testUpdateProfileRequiresExpertRole() throws Exception {
        Map<String, Object> profileUpdate = new HashMap<>();
        profileUpdate.put("firstName", "Updated");

        mockMvc.perform(put("/api/expert/profile")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileUpdate)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testRefreshTokenRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/expert/refresh-token"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testRefreshTokenWithExpertRole() throws Exception {
        mockMvc.perform(post("/api/expert/refresh-token")
                        .header("Authorization", "Bearer " + expertToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.user").exists());
    }
}

