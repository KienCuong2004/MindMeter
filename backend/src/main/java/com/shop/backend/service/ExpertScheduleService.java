package com.shop.backend.service;

import com.shop.backend.model.ExpertBreak;
import com.shop.backend.model.ExpertSchedule;
import com.shop.backend.model.User;
import com.shop.backend.repository.ExpertBreakRepository;
import com.shop.backend.repository.ExpertScheduleRepository;
import com.shop.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.shop.backend.model.Role;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpertScheduleService {
    
    private final ExpertScheduleRepository expertScheduleRepository;
    private final ExpertBreakRepository expertBreakRepository;
    private final UserRepository userRepository;
    
    /**
     * Tạo lịch làm việc cho chuyên gia
     */
    @Transactional
    public ExpertSchedule createSchedule(ExpertSchedule schedule) {
        // Kiểm tra xem chuyên gia có tồn tại không
        User expert = schedule.getExpert();
        if (expert == null) {
            throw new RuntimeException("Chuyên gia không được cung cấp");
        }
        
        // Kiểm tra xem chuyên gia có phải là EXPERT không
        if (expert.getRole() != Role.EXPERT) {
            throw new RuntimeException("Người dùng này không phải là chuyên gia");
        }
        
        // Kiểm tra xem đã có lịch làm việc cho ngày này chưa
        Optional<ExpertSchedule> existingSchedule = expertScheduleRepository
            .findByExpertAndDayOfWeekAndIsAvailable(expert, schedule.getDayOfWeek(), true);
        
        if (existingSchedule.isPresent()) {
            // Nếu đã có lịch làm việc, cập nhật thay vì tạo mới
            ExpertSchedule existing = existingSchedule.get();
            existing.setStartTime(schedule.getStartTime());
            existing.setEndTime(schedule.getEndTime());
            existing.setIsAvailable(schedule.getIsAvailable());
            existing.setMaxAppointmentsPerDay(schedule.getMaxAppointmentsPerDay());
            existing.setAppointmentDurationMinutes(schedule.getAppointmentDurationMinutes());
            existing.setBreakDurationMinutes(schedule.getBreakDurationMinutes());
            existing.setUpdatedAt(LocalDateTime.now());
            return expertScheduleRepository.save(existing);
        }
        
        // Nếu chưa có, tạo mới
        return expertScheduleRepository.save(schedule);
    }
    
    /**
     * Cập nhật lịch làm việc
     */
    @Transactional
    public ExpertSchedule updateSchedule(Long scheduleId, ExpertSchedule updatedSchedule) {
        ExpertSchedule existingSchedule = expertScheduleRepository.findById(scheduleId)
            .orElseThrow(() -> new RuntimeException("Lịch làm việc không tồn tại"));
        
        // Cập nhật các trường cần thiết nhưng giữ nguyên expert và dayOfWeek
        existingSchedule.setStartTime(updatedSchedule.getStartTime());
        existingSchedule.setEndTime(updatedSchedule.getEndTime());
        existingSchedule.setIsAvailable(updatedSchedule.getIsAvailable());
        existingSchedule.setMaxAppointmentsPerDay(updatedSchedule.getMaxAppointmentsPerDay());
        existingSchedule.setAppointmentDurationMinutes(updatedSchedule.getAppointmentDurationMinutes());
        existingSchedule.setBreakDurationMinutes(updatedSchedule.getBreakDurationMinutes());
        
        // Đảm bảo expert không bị null
        if (existingSchedule.getExpert() == null) {
            throw new RuntimeException("Lịch làm việc phải có chuyên gia");
        }
        
        return expertScheduleRepository.save(existingSchedule);
    }
    
    /**
     * Xóa lịch làm việc
     */
    @Transactional
    public void deleteSchedule(Long scheduleId) {
        ExpertSchedule schedule = expertScheduleRepository.findById(scheduleId)
            .orElseThrow(() -> new RuntimeException("Lịch làm việc không tồn tại"));
        
        expertScheduleRepository.delete(schedule);
    }
    
    /**
     * Lấy lịch làm việc của chuyên gia
     */
    public List<ExpertSchedule> getExpertSchedules(Long expertId) {
        User expert = userRepository.findById(expertId)
            .orElseThrow(() -> new RuntimeException("Chuyên gia không tồn tại"));
        
        return expertScheduleRepository.findByExpertOrderByDayOfWeekAsc(expert);
    }
    
    /**
     * Lấy lịch làm việc của chuyên gia theo ngày
     */
    public Optional<ExpertSchedule> getExpertScheduleByDay(Long expertId, DayOfWeek dayOfWeek) {
        User expert = userRepository.findById(expertId)
            .orElseThrow(() -> new RuntimeException("Chuyên gia không tồn tại"));
        
        return expertScheduleRepository.findByExpertAndDayOfWeekAndIsAvailable(expert, dayOfWeek, true);
    }
    
    /**
     * Tạo thời gian nghỉ cho chuyên gia
     */
    @Transactional
    public ExpertBreak createBreak(ExpertBreak expertBreak) {
        // Kiểm tra xem chuyên gia có tồn tại không
        User expert = expertBreak.getExpert();
        if (expert == null) {
            throw new RuntimeException("Chuyên gia không được cung cấp");
        }
        
        // Kiểm tra xem chuyên gia có phải là EXPERT không
        if (expert.getRole() != Role.EXPERT) {
            throw new RuntimeException("Người dùng này không phải là chuyên gia");
        }
        
        return expertBreakRepository.save(expertBreak);
    }
    
    /**
     * Cập nhật thời gian nghỉ
     */
    @Transactional
    public ExpertBreak updateBreak(Long breakId, ExpertBreak updatedBreak) {
        ExpertBreak existingBreak = expertBreakRepository.findById(breakId)
            .orElseThrow(() -> new RuntimeException("Thời gian nghỉ không tồn tại"));
        
        // Cập nhật các trường cần thiết nhưng giữ nguyên expert
        existingBreak.setBreakDate(updatedBreak.getBreakDate());
        existingBreak.setStartTime(updatedBreak.getStartTime());
        existingBreak.setEndTime(updatedBreak.getEndTime());
        existingBreak.setReason(updatedBreak.getReason());
        existingBreak.setIsRecurring(updatedBreak.getIsRecurring());
        existingBreak.setRecurringPattern(updatedBreak.getRecurringPattern());
        
        // Đảm bảo expert không bị null
        if (existingBreak.getExpert() == null) {
            throw new RuntimeException("Thời gian nghỉ phải có chuyên gia");
        }
        
        return expertBreakRepository.save(existingBreak);
    }
    
    /**
     * Xóa thời gian nghỉ
     */
    @Transactional
    public void deleteBreak(Long breakId) {
        ExpertBreak expertBreak = expertBreakRepository.findById(breakId)
            .orElseThrow(() -> new RuntimeException("Thời gian nghỉ không tồn tại"));
        
        expertBreakRepository.delete(expertBreak);
    }
    
    /**
     * Lấy thời gian nghỉ của chuyên gia
     */
    public List<ExpertBreak> getExpertBreaks(Long expertId) {
        User expert = userRepository.findById(expertId)
            .orElseThrow(() -> new RuntimeException("Chuyên gia không tồn tại"));
        
        return expertBreakRepository.findByExpertOrderByBreakDateAsc(expert);
    }
    
    /**
     * Lấy thời gian nghỉ của chuyên gia theo khoảng thời gian
     */
    public List<ExpertBreak> getExpertBreaksByDateRange(Long expertId, LocalDate startDate, LocalDate endDate) {
        User expert = userRepository.findById(expertId)
            .orElseThrow(() -> new RuntimeException("Chuyên gia không tồn tại"));
        
        return expertBreakRepository.findByExpertAndBreakDateBetween(expert, startDate, endDate);
    }
    
    /**
     * Kiểm tra xem chuyên gia có khả dụng trong khoảng thời gian không
     */
    public boolean isExpertAvailable(Long expertId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        // Kiểm tra xem có lịch làm việc trong ngày này không
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        Optional<ExpertSchedule> schedule = getExpertScheduleByDay(expertId, dayOfWeek);
        
        if (schedule.isEmpty()) {
            return false; // Không có lịch làm việc trong ngày này
        }
        
        ExpertSchedule expertSchedule = schedule.get();
        
        // Kiểm tra xem thời gian có nằm trong giờ làm việc không
        if (startTime.isBefore(expertSchedule.getStartTime()) || endTime.isAfter(expertSchedule.getEndTime())) {
            return false; // Thời gian nằm ngoài giờ làm việc
        }
        
        // Kiểm tra xem có thời gian nghỉ nào trùng không
        List<ExpertBreak> conflictingBreaks = expertBreakRepository
            .findConflictingBreaks(expertId, date, startTime, endTime);
        
        return conflictingBreaks.isEmpty();
    }
    
    /**
     * Lấy tất cả chuyên gia có lịch làm việc
     */
    public List<User> getAvailableExperts() {
        return expertScheduleRepository.findAvailableExperts();
    }
}
