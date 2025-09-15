package com.shop.backend.controller;

import com.shop.backend.model.ExpertBreak;
import com.shop.backend.model.ExpertSchedule;
import com.shop.backend.model.User;
import com.shop.backend.service.ExpertScheduleService;
import com.shop.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/expert-schedules")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ExpertScheduleController {
    
    private final ExpertScheduleService expertScheduleService;
    private final UserRepository userRepository;
    
    /**
     * Tạo lịch làm việc mới
     */
    @PostMapping
    public ResponseEntity<ExpertSchedule> createSchedule(@RequestBody ExpertSchedule schedule) {
        try {
            Long expertId = getCurrentUserId();
            if (expertId == null) {
                return ResponseEntity.badRequest().build();
            }
            
            // Lấy user từ database
            User expert = userRepository.findById(expertId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chuyên gia"));
            
            // Set expert vào schedule
            schedule.setExpert(expert);
            
            ExpertSchedule createdSchedule = expertScheduleService.createSchedule(schedule);
            return ResponseEntity.ok(createdSchedule);
        } catch (Exception e) {
            log.error("Lỗi khi tạo lịch làm việc: ", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Cập nhật lịch làm việc
     */
    @PutMapping("/{scheduleId}")
    public ResponseEntity<ExpertSchedule> updateSchedule(
            @PathVariable Long scheduleId,
            @RequestBody ExpertSchedule updatedSchedule) {
        try {
            // Kiểm tra xem người dùng hiện tại có quyền cập nhật lịch làm việc này không
            Long currentUserId = getCurrentUserId();
            if (currentUserId == null) {
                return ResponseEntity.badRequest().build();
            }
            
            // Lấy lịch làm việc hiện tại để kiểm tra quyền
            List<ExpertSchedule> mySchedules = expertScheduleService.getExpertSchedules(currentUserId);
            boolean hasPermission = mySchedules.stream()
                .anyMatch(schedule -> schedule.getId().equals(scheduleId));
            
            if (!hasPermission) {
                log.error("Người dùng {} không có quyền cập nhật lịch làm việc {}", currentUserId, scheduleId);
                return ResponseEntity.status(403).build();
            }
            
            ExpertSchedule schedule = expertScheduleService.updateSchedule(scheduleId, updatedSchedule);
            return ResponseEntity.ok(schedule);
        } catch (Exception e) {
            log.error("Lỗi khi cập nhật lịch làm việc {}: ", scheduleId, e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Xóa lịch làm việc
     */
    @DeleteMapping("/{scheduleId}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long scheduleId) {
        try {
            // Kiểm tra xem người dùng hiện tại có quyền xóa lịch làm việc này không
            Long currentUserId = getCurrentUserId();
            if (currentUserId == null) {
                return ResponseEntity.badRequest().build();
            }
            
            // Lấy lịch làm việc hiện tại để kiểm tra quyền
            List<ExpertSchedule> mySchedules = expertScheduleService.getExpertSchedules(currentUserId);
            boolean hasPermission = mySchedules.stream()
                .anyMatch(schedule -> schedule.getId().equals(scheduleId));
            
            if (!hasPermission) {
                log.error("Người dùng {} không có quyền xóa lịch làm việc {}", currentUserId, scheduleId);
                return ResponseEntity.status(403).build();
            }
            
            expertScheduleService.deleteSchedule(scheduleId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Lỗi khi xóa lịch làm việc {}: ", scheduleId, e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Lấy lịch làm việc của chuyên gia hiện tại
     */
    @GetMapping("/my-schedules")
    public ResponseEntity<List<ExpertSchedule>> getMySchedules() {
        try {
            Long expertId = getCurrentUserId();
            List<ExpertSchedule> schedules = expertScheduleService.getExpertSchedules(expertId);
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            log.error("Lỗi khi lấy lịch làm việc: ", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Lấy lịch làm việc của chuyên gia theo ID
     */
    @GetMapping("/expert/{expertId}")
    public ResponseEntity<List<ExpertSchedule>> getExpertSchedules(@PathVariable Long expertId) {
        try {
            List<ExpertSchedule> schedules = expertScheduleService.getExpertSchedules(expertId);
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            log.error("Lỗi khi lấy lịch làm việc của chuyên gia: ", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Lấy lịch làm việc của chuyên gia theo ngày
     */
    @GetMapping("/expert/{expertId}/day/{dayOfWeek}")
    public ResponseEntity<ExpertSchedule> getExpertScheduleByDay(
            @PathVariable Long expertId,
            @PathVariable DayOfWeek dayOfWeek) {
        try {
            var schedule = expertScheduleService.getExpertScheduleByDay(expertId, dayOfWeek);
            return schedule.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Lỗi khi lấy lịch làm việc theo ngày: ", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Tạo thời gian nghỉ mới
     */
    @PostMapping("/breaks")
    public ResponseEntity<ExpertBreak> createBreak(@RequestBody ExpertBreak expertBreak) {
        try {
            Long expertId = getCurrentUserId();
            if (expertId == null) {
                return ResponseEntity.badRequest().build();
            }
            
            // Lấy user từ database
            User expert = userRepository.findById(expertId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chuyên gia"));
            
            // Set expert vào expertBreak
            expertBreak.setExpert(expert);
            
            ExpertBreak createdBreak = expertScheduleService.createBreak(expertBreak);
            return ResponseEntity.ok(createdBreak);
        } catch (Exception e) {
            log.error("Lỗi khi tạo thời gian nghỉ: ", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Cập nhật thời gian nghỉ
     */
    @PutMapping("/breaks/{breakId}")
    public ResponseEntity<ExpertBreak> updateBreak(
            @PathVariable Long breakId,
            @RequestBody ExpertBreak updatedBreak) {
        try {
            // Kiểm tra xem người dùng hiện tại có quyền cập nhật thời gian nghỉ này không
            Long currentUserId = getCurrentUserId();
            if (currentUserId == null) {
                return ResponseEntity.badRequest().build();
            }
            
            // Lấy thời gian nghỉ hiện tại để kiểm tra quyền
            List<ExpertBreak> myBreaks = expertScheduleService.getExpertBreaks(currentUserId);
            boolean hasPermission = myBreaks.stream()
                .anyMatch(break_ -> break_.getId().equals(breakId));
            
            if (!hasPermission) {
                log.error("Người dùng {} không có quyền cập nhật thời gian nghỉ {}", currentUserId, breakId);
                return ResponseEntity.status(403).build();
            }
            
            ExpertBreak break_ = expertScheduleService.updateBreak(breakId, updatedBreak);
            return ResponseEntity.ok(break_);
        } catch (Exception e) {
            log.error("Lỗi khi cập nhật thời gian nghỉ {}: ", breakId, e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Xóa thời gian nghỉ
     */
    @DeleteMapping("/breaks/{breakId}")
    public ResponseEntity<Void> deleteBreak(@PathVariable Long breakId) {
        try {
            // Kiểm tra xem người dùng hiện tại có quyền xóa thời gian nghỉ này không
            Long currentUserId = getCurrentUserId();
            if (currentUserId == null) {
                return ResponseEntity.badRequest().build();
            }
            
            // Lấy thời gian nghỉ hiện tại để kiểm tra quyền
            List<ExpertBreak> myBreaks = expertScheduleService.getExpertBreaks(currentUserId);
            boolean hasPermission = myBreaks.stream()
                .anyMatch(break_ -> break_.getId().equals(breakId));
            
            if (!hasPermission) {
                log.error("Người dùng {} không có quyền xóa thời gian nghỉ {}", currentUserId, breakId);
                return ResponseEntity.status(403).build();
            }
            
            expertScheduleService.deleteBreak(breakId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Lỗi khi xóa thời gian nghỉ {}: ", breakId, e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Lấy thời gian nghỉ của chuyên gia hiện tại
     */
    @GetMapping("/my-breaks")
    public ResponseEntity<List<ExpertBreak>> getMyBreaks() {
        try {
            Long expertId = getCurrentUserId();
            List<ExpertBreak> breaks = expertScheduleService.getExpertBreaks(expertId);
            return ResponseEntity.ok(breaks);
        } catch (Exception e) {
            log.error("Lỗi khi lấy thời gian nghỉ: ", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Lấy thời gian nghỉ của chuyên gia theo ID
     */
    @GetMapping("/expert/{expertId}/breaks")
    public ResponseEntity<List<ExpertBreak>> getExpertBreaks(@PathVariable Long expertId) {
        try {
            List<ExpertBreak> breaks = expertScheduleService.getExpertBreaks(expertId);
            return ResponseEntity.ok(breaks);
        } catch (Exception e) {
            log.error("Lỗi khi lấy thời gian nghỉ của chuyên gia: ", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Lấy thời gian nghỉ của chuyên gia theo khoảng thời gian
     */
    @GetMapping("/expert/{expertId}/breaks/range")
    public ResponseEntity<List<ExpertBreak>> getExpertBreaksByDateRange(
            @PathVariable Long expertId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        try {
            List<ExpertBreak> breaks = expertScheduleService.getExpertBreaksByDateRange(expertId, startDate, endDate);
            return ResponseEntity.ok(breaks);
        } catch (Exception e) {
            log.error("Lỗi khi lấy thời gian nghỉ theo khoảng thời gian: ", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Kiểm tra xem chuyên gia có khả dụng trong khoảng thời gian không
     */
    @GetMapping("/expert/{expertId}/availability")
    public ResponseEntity<Boolean> checkExpertAvailability(
            @PathVariable Long expertId,
            @RequestParam LocalDate date,
            @RequestParam String startTime,
            @RequestParam String endTime) {
        try {
            java.time.LocalTime start = java.time.LocalTime.parse(startTime);
            java.time.LocalTime end = java.time.LocalTime.parse(endTime);
            boolean isAvailable = expertScheduleService.isExpertAvailable(expertId, date, start, end);
            return ResponseEntity.ok(isAvailable);
        } catch (Exception e) {
            log.error("Lỗi khi kiểm tra khả dụng của chuyên gia: ", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Lấy tất cả chuyên gia có lịch làm việc
     */
    @GetMapping("/available-experts")
    public ResponseEntity<List<User>> getAvailableExperts() {
        try {
            List<User> experts = expertScheduleService.getAvailableExperts();
            return ResponseEntity.ok(experts);
        } catch (Exception e) {
            log.error("Lỗi khi lấy danh sách chuyên gia khả dụng: ", e);
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
            try {
                // Lấy user từ database bằng email
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
