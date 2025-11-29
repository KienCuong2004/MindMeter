package com.shop.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shop.backend.model.Appointment;
import com.shop.backend.model.ExpertSchedule;
import com.shop.backend.model.User;
import com.shop.backend.model.Role;
import com.shop.backend.repository.AppointmentRepository;
import com.shop.backend.repository.ExpertScheduleRepository;
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

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Transactional
class AppointmentIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private ExpertScheduleRepository expertScheduleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private User studentUser;
    private User expertUser;
    private String studentToken;
    private ExpertSchedule schedule;

    @BeforeEach
    void setUp() {
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

        // Create expert user
        expertUser = new User();
        expertUser.setEmail("expert@example.com");
        expertUser.setPassword(passwordEncoder.encode("password123"));
        expertUser.setFirstName("Expert");
        expertUser.setLastName("User");
        expertUser.setRole(Role.EXPERT);
        expertUser.setStatus(User.Status.ACTIVE);
        expertUser = userRepository.save(expertUser);

        // Create expert schedule
        schedule = new ExpertSchedule();
        schedule.setExpert(expertUser);
        schedule.setDayOfWeek(DayOfWeek.MONDAY);
        schedule.setStartTime(LocalTime.of(9, 0));
        schedule.setEndTime(LocalTime.of(10, 0));
        schedule.setIsAvailable(true);
        schedule = expertScheduleRepository.save(schedule);
    }

    @Test
    void createAppointment_AsStudent_ShouldCreateAppointment() throws Exception {
        // Given
        LocalDateTime appointmentDateTime = LocalDateTime.now().plusDays(1).withHour(9).withMinute(0);
        Map<String, Object> appointmentData = new HashMap<>();
        appointmentData.put("expertId", expertUser.getId());
        appointmentData.put("appointmentDate", appointmentDateTime.toString());
        appointmentData.put("durationMinutes", 60);
        appointmentData.put("consultationType", "ONLINE");

        // When & Then
        mockMvc.perform(post("/api/appointments")
                .header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(appointmentData)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.expertId").value(expertUser.getId()));
    }

    @Test
    void createAppointment_WithoutAuth_ShouldReturnUnauthorized() throws Exception {
        // Given
        LocalDateTime appointmentDateTime = LocalDateTime.now().plusDays(1).withHour(9).withMinute(0);
        Map<String, Object> appointmentData = new HashMap<>();
        appointmentData.put("expertId", expertUser.getId());
        appointmentData.put("appointmentDate", appointmentDateTime.toString());

        // When & Then
        mockMvc.perform(post("/api/appointments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(appointmentData)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getAppointments_AsStudent_ShouldReturnStudentAppointments() throws Exception {
        // Given - Create an appointment
        LocalDateTime appointmentDateTime = LocalDateTime.now().plusDays(1).withHour(9).withMinute(0);
        Appointment appointment = new Appointment();
        appointment.setStudent(studentUser);
        appointment.setExpert(expertUser);
        appointment.setAppointmentDate(appointmentDateTime);
        appointment.setDurationMinutes(60);
        appointment.setStatus(Appointment.AppointmentStatus.CONFIRMED);
        appointmentRepository.save(appointment);

        // When & Then
        mockMvc.perform(get("/api/appointments")
                .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].studentId").value(studentUser.getId()));
    }

    @Test
    void cancelAppointment_AsStudent_ShouldCancelAppointment() throws Exception {
        // Given - Create an appointment
        LocalDateTime appointmentDateTime = LocalDateTime.now().plusDays(1).withHour(9).withMinute(0);
        Appointment appointment = new Appointment();
        appointment.setStudent(studentUser);
        appointment.setExpert(expertUser);
        appointment.setAppointmentDate(appointmentDateTime);
        appointment.setDurationMinutes(60);
        appointment.setStatus(Appointment.AppointmentStatus.CONFIRMED);
        appointment = appointmentRepository.save(appointment);

        Map<String, Object> cancelData = new HashMap<>();
        cancelData.put("reason", "Changed my mind");

        // When & Then
        mockMvc.perform(put("/api/appointments/" + appointment.getId() + "/cancel")
                .header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(cancelData)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void getExpertSchedules_ShouldReturnSchedules() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/expert-schedules")
                .param("expertId", String.valueOf(expertUser.getId()))
                .param("startDate", LocalDateTime.now().toString())
                .param("endDate", LocalDateTime.now().plusDays(7).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}

