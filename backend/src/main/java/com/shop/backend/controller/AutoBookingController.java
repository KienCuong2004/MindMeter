package com.shop.backend.controller;

import com.shop.backend.dto.appointment.AutoBookingRequest;
import com.shop.backend.dto.appointment.AutoBookingResponse;
import com.shop.backend.service.AutoBookingService;
import com.shop.backend.repository.UserRepository;
import com.shop.backend.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auto-booking")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AutoBookingController {
    
    private final AutoBookingService autoBookingService;
    private final UserRepository userRepository;
    
    /**
     * Đặt lịch hẹn tự động thông qua chatbot
     */
    @PostMapping
    public ResponseEntity<AutoBookingResponse> autoBookAppointment(@RequestBody AutoBookingRequest request) {
        try {
            Long studentId = getCurrentUserId();
            AutoBookingResponse response = autoBookingService.autoBookAppointment(request, studentId);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            log.error("Lỗi khi đặt lịch tự động: ", e);
            return ResponseEntity.badRequest().body(new AutoBookingResponse(
                false, "Có lỗi xảy ra khi đặt lịch: " + e.getMessage(), 
                null, null, null, null, null, null, null
            ));
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
