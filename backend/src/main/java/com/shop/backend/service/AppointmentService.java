package com.shop.backend.service;

import com.shop.backend.dto.auth.appointment.AppointmentRequest;
import com.shop.backend.dto.auth.appointment.AppointmentResponse;
import com.shop.backend.dto.auth.appointment.AvailableSlotRequest;
import com.shop.backend.dto.auth.appointment.AvailableSlotResponse;
import com.shop.backend.model.Appointment;
import com.shop.backend.model.ExpertBreak;
import com.shop.backend.model.ExpertSchedule;
import com.shop.backend.model.User;
import com.shop.backend.repository.AppointmentRepository;
import com.shop.backend.repository.ExpertBreakRepository;
import com.shop.backend.repository.ExpertScheduleRepository;
import com.shop.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import com.shop.backend.model.Role;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {
    
    private final AppointmentRepository appointmentRepository;
    private final ExpertScheduleRepository expertScheduleRepository;
    private final ExpertBreakRepository expertBreakRepository;
    private final UserRepository userRepository;
    
    /**
     * Tạo lịch hẹn mới
     */
    @Transactional
    public AppointmentResponse createAppointment(AppointmentRequest request, Long studentId) {
        log.info("Tạo lịch hẹn với request: {}", request); // Debug log
        log.info("Student ID: {}", studentId); // Debug log
        
        // Kiểm tra học sinh và chuyên gia tồn tại
        User student = userRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Học sinh không tồn tại"));
        
        User expert = userRepository.findById(request.getExpertId())
            .orElseThrow(() -> new RuntimeException("Chuyên gia không tồn tại"));
        
        log.info("Student: {}, Expert: {}", student.getEmail(), expert.getEmail()); // Debug log
        
        // Kiểm tra xem chuyên gia có phải là EXPERT không
        if (expert.getRole() != Role.EXPERT) {
            throw new RuntimeException("Người dùng này không phải là chuyên gia");
        }
        
        // Kiểm tra xem slot thời gian có khả dụng không
        log.info("Kiểm tra slot khả dụng cho expert {} tại thời gian {} với thời lượng {} phút", 
                request.getExpertId(), request.getAppointmentDate(), request.getDurationMinutes()); // Debug log
        
        if (!isTimeSlotAvailable(request.getExpertId(), request.getAppointmentDate(), 
                               request.getDurationMinutes())) {
            log.info("Slot không khả dụng, throw exception"); // Debug log
            throw new RuntimeException("Slot thời gian này không khả dụng");
        }
        
        log.info("Slot khả dụng, tiếp tục tạo lịch hẹn"); // Debug log
        
        // Tạo lịch hẹn mới
        Appointment appointment = new Appointment();
        appointment.setStudent(student);
        appointment.setExpert(expert);
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setDurationMinutes(request.getDurationMinutes());
        appointment.setConsultationType(request.getConsultationType());
        appointment.setNotes(request.getNotes());
        appointment.setMeetingLocation(request.getMeetingLocation());
        appointment.setStatus(Appointment.AppointmentStatus.PENDING);
        
        Appointment savedAppointment = appointmentRepository.save(appointment);
        
        return convertToResponse(savedAppointment);
    }
    
    /**
     * Xác nhận lịch hẹn
     */
    @Transactional
    public AppointmentResponse confirmAppointment(Long appointmentId, Long expertId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Lịch hẹn không tồn tại"));
        
        if (!appointment.getExpert().getId().equals(expertId)) {
            throw new RuntimeException("Bạn không có quyền xác nhận lịch hẹn này");
        }
        
        if (appointment.getStatus() != Appointment.AppointmentStatus.PENDING) {
            throw new RuntimeException("Lịch hẹn này không thể xác nhận");
        }
        
        appointment.setStatus(Appointment.AppointmentStatus.CONFIRMED);
        Appointment savedAppointment = appointmentRepository.save(appointment);
        
        return convertToResponse(savedAppointment);
    }
    
    /**
     * Hủy lịch hẹn
     */
    @Transactional
    public AppointmentResponse cancelAppointment(Long appointmentId, Long userId, String reason, String cancelledBy) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Lịch hẹn không tồn tại"));
        
        // Kiểm tra quyền hủy lịch hẹn
        if (!appointment.getStudent().getId().equals(userId) && 
            !appointment.getExpert().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền hủy lịch hẹn này");
        }
        
        if (appointment.getStatus() == Appointment.AppointmentStatus.CANCELLED) {
            throw new RuntimeException("Lịch hẹn này đã bị hủy");
        }
        
        if (appointment.getStatus() == Appointment.AppointmentStatus.COMPLETED) {
            throw new RuntimeException("Không thể hủy lịch hẹn đã hoàn thành");
        }
        
        appointment.setStatus(Appointment.AppointmentStatus.CANCELLED);
        appointment.setCancellationReason(reason);
        appointment.setCancelledBy(cancelledBy);
        
        Appointment savedAppointment = appointmentRepository.save(appointment);
        
        return convertToResponse(savedAppointment);
    }
    
    /**
     * Tìm slot trống cho lịch hẹn
     */
    public AvailableSlotResponse findAvailableSlots(AvailableSlotRequest request) {
        User expert = userRepository.findById(request.getExpertId())
            .orElseThrow(() -> new RuntimeException("Chuyên gia không tồn tại"));
        
        List<AvailableSlotResponse.TimeSlot> availableSlots = new ArrayList<>();
        
        LocalDate currentDate = request.getStartDate();
        LocalDate endDate = request.getEndDate();
        
        while (!currentDate.isAfter(endDate)) {
            DayOfWeek dayOfWeek = currentDate.getDayOfWeek();
            
            // Tìm lịch làm việc của chuyên gia trong ngày này
            Optional<ExpertSchedule> schedule = expertScheduleRepository
                .findByExpertAndDayOfWeekAndIsAvailable(expert, dayOfWeek, true);
            
            if (schedule.isPresent()) {
                ExpertSchedule expertSchedule = schedule.get();
                LocalTime startTime = expertSchedule.getStartTime();
                LocalTime endTime = expertSchedule.getEndTime();
                
                // Tạo các slot thời gian
                LocalTime currentTime = startTime;
                while (currentTime.plusMinutes(request.getDurationMinutes()).isBefore(endTime) || 
                       currentTime.plusMinutes(request.getDurationMinutes()).equals(endTime)) {
                    
                    LocalDateTime slotStart = LocalDateTime.of(currentDate, currentTime);
                    LocalDateTime slotEnd = slotStart.plusMinutes(request.getDurationMinutes());
                    
                    // Kiểm tra xem slot có khả dụng không
                    if (isTimeSlotAvailable(request.getExpertId(), slotStart, request.getDurationMinutes())) {
                        AvailableSlotResponse.TimeSlot slot = new AvailableSlotResponse.TimeSlot();
                        slot.setStartTime(slotStart);
                        slot.setEndTime(slotEnd);
                        slot.setDurationMinutes(request.getDurationMinutes());
                        slot.setConsultationType(request.getConsultationType());
                        slot.setIsAvailable(true);
                        
                        availableSlots.add(slot);
                    }
                    
                    // Chuyển sang slot tiếp theo (có tính thời gian nghỉ)
                    currentTime = currentTime.plusMinutes(request.getDurationMinutes() + expertSchedule.getBreakDurationMinutes());
                }
            }
            
            currentDate = currentDate.plusDays(1);
        }
        
        AvailableSlotResponse response = new AvailableSlotResponse();
        response.setExpertId(expert.getId());
        response.setExpertName(expert.getFirstName() + " " + expert.getLastName());
        response.setAvailableSlots(availableSlots);
        
        return response;
    }
    
    /**
     * Lấy danh sách lịch hẹn của học sinh
     */
    public List<AppointmentResponse> getStudentAppointments(Long studentId) {
        User student = userRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Học sinh không tồn tại"));
        
        List<Appointment> appointments = appointmentRepository.findByStudentOrderByAppointmentDateDesc(student);
        
        return appointments.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Lấy danh sách lịch hẹn của chuyên gia
     */
    public List<AppointmentResponse> getExpertAppointments(Long expertId) {
        User expert = userRepository.findById(expertId)
            .orElseThrow(() -> new RuntimeException("Chuyên gia không tồn tại"));
        
        List<Appointment> appointments = appointmentRepository.findByExpertOrderByAppointmentDateDesc(expert);
        
        return appointments.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Lấy lịch hẹn theo ID
     */
    public AppointmentResponse getAppointmentById(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Lịch hẹn không tồn tại"));
        
        return convertToResponse(appointment);
    }
    
    /**
     * Kiểm tra xem slot thời gian có khả dụng không
     */
    private boolean isTimeSlotAvailable(Long expertId, LocalDateTime startTime, Integer durationMinutes) {
        LocalDateTime endTime = startTime.plusMinutes(durationMinutes);
        
        // Kiểm tra xem chuyên gia có tồn tại không
        User expert = userRepository.findById(expertId)
            .orElseThrow(() -> new RuntimeException("Chuyên gia không tồn tại"));
        
        // Kiểm tra xem có lịch hẹn nào trùng thời gian không
        // Lấy tất cả lịch hẹn của chuyên gia trong ngày
        LocalDate appointmentDate = startTime.toLocalDate();
        LocalDateTime dayStart = appointmentDate.atStartOfDay();
        LocalDateTime dayEnd = appointmentDate.atTime(23, 59, 59);
        
        List<Appointment> existingAppointments = appointmentRepository
            .findByExpertAndAppointmentDateBetweenOrderByAppointmentDate(expert, dayStart, dayEnd);
        
        log.info("Kiểm tra slot khả dụng cho expert {} từ {} đến {}, tìm thấy {} lịch hẹn", 
                expertId, dayStart, dayEnd, existingAppointments.size()); // Debug log
        
        // Kiểm tra xem có lịch hẹn nào trùng thời gian không
        for (Appointment existing : existingAppointments) {
            if (existing.getStatus() == Appointment.AppointmentStatus.CANCELLED || 
                existing.getStatus() == Appointment.AppointmentStatus.NO_SHOW) {
                continue;
            }
            
            LocalDateTime existingStart = existing.getAppointmentDate();
            LocalDateTime existingEnd = existingStart.plusMinutes(existing.getDurationMinutes());
            
            log.info("Kiểm tra lịch hẹn hiện tại: {} - {} vs slot mới: {} - {}", 
                    existingStart, existingEnd, startTime, endTime); // Debug log
            
            // Kiểm tra xem có trùng thời gian không
            if (!(endTime.isBefore(existingStart) || startTime.isAfter(existingEnd))) {
                log.info("Slot bị trùng với lịch hẹn hiện tại"); // Debug log
                return false;
            }
        }
        
        // Kiểm tra xem có thời gian nghỉ nào trùng không
        LocalDate breakDate = startTime.toLocalDate();
        LocalTime startTimeOfDay = startTime.toLocalTime();
        LocalTime endTimeOfDay = endTime.toLocalTime();
        
        List<ExpertBreak> conflictingBreaks = expertBreakRepository
            .findConflictingBreaks(expertId, breakDate, startTimeOfDay, endTimeOfDay);
        
        if (!conflictingBreaks.isEmpty()) {
            log.info("Slot bị trùng với thời gian nghỉ: {}", conflictingBreaks); // Debug log
        }
        
        return conflictingBreaks.isEmpty();
    }
    
    /**
     * Chuyển đổi Appointment thành AppointmentResponse
     */
    private AppointmentResponse convertToResponse(Appointment appointment) {
        AppointmentResponse response = new AppointmentResponse();
        response.setId(appointment.getId());
        response.setStudentId(appointment.getStudent().getId());
        response.setStudentName(appointment.getStudent().getFirstName() + " " + appointment.getStudent().getLastName());
        response.setStudentEmail(appointment.getStudent().getEmail());
        response.setExpertId(appointment.getExpert().getId());
        response.setExpertName(appointment.getExpert().getFirstName() + " " + appointment.getExpert().getLastName());
        response.setExpertEmail(appointment.getExpert().getEmail());
        response.setAppointmentDate(appointment.getAppointmentDate());
        response.setDurationMinutes(appointment.getDurationMinutes());
        response.setStatus(appointment.getStatus());
        response.setConsultationType(appointment.getConsultationType());
        response.setMeetingLink(appointment.getMeetingLink());
        response.setMeetingLocation(appointment.getMeetingLocation());
        response.setNotes(appointment.getNotes());
        response.setExpertNotes(appointment.getExpertNotes());
        response.setCancellationReason(appointment.getCancellationReason());
        response.setCancelledBy(appointment.getCancelledBy());
        response.setCreatedAt(appointment.getCreatedAt());
        response.setUpdatedAt(appointment.getUpdatedAt());
        
        return response;
    }
}
