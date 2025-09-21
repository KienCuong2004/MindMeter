package com.shop.backend.controller;

import com.shop.backend.service.AppointmentService;
import com.shop.backend.repository.UserRepository;
import com.shop.backend.dto.auth.appointment.AppointmentRequest;
import com.shop.backend.dto.auth.appointment.AppointmentResponse;
import com.shop.backend.dto.auth.appointment.AvailableSlotRequest;
import com.shop.backend.dto.auth.appointment.AvailableSlotResponse;
import com.shop.backend.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AppointmentController {
    
    private final AppointmentService appointmentService;
    private final UserRepository userRepository;
    
    /**
     * Tạo lịch hẹn mới
     */
    @PostMapping
    public ResponseEntity<?> createAppointment(@RequestBody AppointmentRequest request) {
        try {
            Long studentId = getCurrentUserId();
            AppointmentResponse response = appointmentService.createAppointment(request, studentId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Lỗi khi tạo lịch hẹn: ", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Xác nhận lịch hẹn
     */
    @PutMapping("/{appointmentId}/confirm")
    public ResponseEntity<AppointmentResponse> confirmAppointment(@PathVariable Long appointmentId) {
        try {
            Long expertId = getCurrentUserId();
            AppointmentResponse response = appointmentService.confirmAppointment(appointmentId, expertId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Lỗi khi xác nhận lịch hẹn: ", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Hủy lịch hẹn
     */
    @PutMapping("/{appointmentId}/cancel")
    public ResponseEntity<AppointmentResponse> cancelAppointment(
            @PathVariable Long appointmentId,
            @RequestParam String reason,
            @RequestParam String cancelledBy) {
        try {
            Long userId = getCurrentUserId();
            AppointmentResponse response = appointmentService.cancelAppointment(appointmentId, userId, reason, cancelledBy);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Lỗi khi hủy lịch hẹn: ", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Tìm slot trống cho lịch hẹn
     */
    @PostMapping("/available-slots")
    public ResponseEntity<AvailableSlotResponse> findAvailableSlots(@RequestBody AvailableSlotRequest request) {
        try {
            AvailableSlotResponse response = appointmentService.findAvailableSlots(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Lỗi khi tìm slot trống: ", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Lấy danh sách lịch hẹn của học sinh hiện tại
     */
    @GetMapping("/student")
    public ResponseEntity<List<AppointmentResponse>> getStudentAppointments() {
        try {
            Long studentId = getCurrentUserId();
            List<AppointmentResponse> appointments = appointmentService.getStudentAppointments(studentId);
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            log.error("Lỗi khi lấy lịch hẹn của học sinh: ", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Lấy danh sách lịch hẹn của chuyên gia hiện tại
     */
    @GetMapping("/expert")
    public ResponseEntity<List<AppointmentResponse>> getExpertAppointments() {
        try {
            Long expertId = getCurrentUserId();
            List<AppointmentResponse> appointments = appointmentService.getExpertAppointments(expertId);
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            log.error("Lỗi khi lấy lịch hẹn của chuyên gia: ", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Lấy lịch hẹn theo ID
     */
    @GetMapping("/{appointmentId}")
    public ResponseEntity<AppointmentResponse> getAppointmentById(@PathVariable Long appointmentId) {
        try {
            AppointmentResponse response = appointmentService.getAppointmentById(appointmentId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Lỗi khi lấy lịch hẹn: ", e);
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Lấy danh sách lịch hẹn của học sinh cụ thể (cho admin)
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<AppointmentResponse>> getStudentAppointmentsById(@PathVariable Long studentId) {
        try {
            List<AppointmentResponse> appointments = appointmentService.getStudentAppointments(studentId);
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            log.error("Lỗi khi lấy lịch hẹn của học sinh: ", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Lấy danh sách lịch hẹn của chuyên gia cụ thể (cho admin)
     */
    @GetMapping("/expert/{expertId}")
    public ResponseEntity<List<AppointmentResponse>> getExpertAppointmentsById(@PathVariable Long expertId) {
        try {
            List<AppointmentResponse> appointments = appointmentService.getExpertAppointments(expertId);
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            log.error("Lỗi khi lấy lịch hẹn của chuyên gia: ", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Lấy ID của người dùng hiện tại từ Security Context
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
            org.springframework.security.core.userdetails.UserDetails userDetails = 
                (org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal();
                            // Lấy user từ database bằng email
                try {
                    User user = userRepository.findByEmail(userDetails.getUsername())
                        .orElse(null);
                    return user != null ? user.getId() : null;
                } catch (Exception e) {
                    log.error("Lỗi khi lấy user ID: ", e);
                    throw new RuntimeException("Không thể xác định người dùng hiện tại");
                }
        }
        throw new RuntimeException("Không thể xác định người dùng hiện tại");
    }
}
