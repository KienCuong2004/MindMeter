package com.shop.backend.service;

import com.shop.backend.dto.auth.appointment.AppointmentRequest;
import com.shop.backend.dto.auth.appointment.AppointmentResponse;
import com.shop.backend.dto.auth.appointment.AvailableSlotRequest;
import com.shop.backend.dto.auth.appointment.AvailableSlotResponse;
import com.shop.backend.model.Appointment;
import com.shop.backend.model.AppointmentHistory;
import com.shop.backend.model.ExpertBreak;
import com.shop.backend.model.ExpertSchedule;
import com.shop.backend.model.User;
import com.shop.backend.repository.AppointmentHistoryRepository;
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
    private final AppointmentEmailService appointmentEmailService;
    private final AppointmentHistoryRepository appointmentHistoryRepository;
    private final MeetingLinkService meetingLinkService;
    private final com.shop.backend.service.NotificationService notificationService;
    
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
        
        // Lưu meeting link nếu được cung cấp từ frontend (không tự động tạo khi đặt lịch)
        // Link sẽ được tự động tạo khi chuyên gia xác nhận
        if (request.getConsultationType() == Appointment.ConsultationType.ONLINE 
            && request.getMeetingLink() != null && !request.getMeetingLink().trim().isEmpty()) {
            appointment.setMeetingLink(request.getMeetingLink());
        }
        
        appointment.setStatus(Appointment.AppointmentStatus.PENDING);
        
        Appointment savedAppointment = appointmentRepository.save(appointment);
        
        // Ghi log lịch sử tạo lịch hẹn
        try {
            saveAppointmentHistory(savedAppointment, AppointmentHistory.HistoryAction.CREATED, 
                    null, savedAppointment.getStatus(), student, "Lịch hẹn được tạo mới");
        } catch (Exception e) {
            log.error("Lỗi khi ghi log lịch sử tạo lịch hẹn: {}", e.getMessage(), e);
        }
        
        // Gửi email thông báo cho học sinh và chuyên gia
        try {
            appointmentEmailService.sendBookingConfirmationToStudent(savedAppointment);
            appointmentEmailService.sendBookingNotificationToExpert(savedAppointment);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email thông báo đặt lịch: {}", e.getMessage(), e);
            // Không throw exception để không ảnh hưởng đến việc tạo appointment
        }
        
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
        
        Appointment.AppointmentStatus oldStatus = appointment.getStatus();
        appointment.setStatus(Appointment.AppointmentStatus.CONFIRMED);
        
        // Tạo meeting link nếu là tư vấn trực tuyến và chưa có link
        if (appointment.getConsultationType() == Appointment.ConsultationType.ONLINE 
            && (appointment.getMeetingLink() == null || appointment.getMeetingLink().trim().isEmpty())) {
            try {
                // Tạo Google Meet link thật qua Google Calendar API (non-blocking)
                String summary = String.format("Tư vấn với %s", appointment.getStudent().getFirstName() + " " + appointment.getStudent().getLastName());
                LocalDateTime startTime = appointment.getAppointmentDate();
                LocalDateTime endTime = startTime.plusMinutes(appointment.getDurationMinutes());
                String description = appointment.getNotes() != null ? appointment.getNotes() : "Cuộc tư vấn tâm lý";
                
                String meetLink = meetingLinkService.generateGoogleMeetLink(
                    summary,
                    startTime,
                    endTime,
                    "Asia/Ho_Chi_Minh",
                    description
                );
                
                // Nếu Google Calendar API trả về null (chưa authenticate hoặc lỗi), dùng fallback
                if (meetLink == null || meetLink.isEmpty()) {
                    log.warn("Google Calendar API không khả dụng, sử dụng link demo. Vui lòng setup Google Calendar API để có link thật.");
                    meetLink = meetingLinkService.generateGoogleMeetLink(); // Fallback to fake link
                }
                
                appointment.setMeetingLink(meetLink);
            } catch (Exception e) {
                // Nếu có lỗi, dùng fallback link để không block request
                log.warn("Error generating Google Meet link, using fallback: {}", e.getMessage());
                appointment.setMeetingLink(meetingLinkService.generateGoogleMeetLink());
            }
        }
        
        Appointment savedAppointment = appointmentRepository.save(appointment);
        
        // Ghi log lịch sử xác nhận lịch hẹn
        try {
            User expert = userRepository.findById(expertId)
                    .orElseThrow(() -> new RuntimeException("Chuyên gia không tồn tại"));
            saveAppointmentHistory(savedAppointment, AppointmentHistory.HistoryAction.CONFIRMED, 
                    oldStatus, savedAppointment.getStatus(), expert, "Lịch hẹn được xác nhận bởi chuyên gia");
        } catch (Exception e) {
            log.error("Lỗi khi ghi log lịch sử xác nhận lịch hẹn: {}", e.getMessage(), e);
        }
        
        // Gửi email xác nhận cho học sinh và chuyên gia
        try {
            appointmentEmailService.sendConfirmationToStudent(savedAppointment);
            appointmentEmailService.sendConfirmationToExpert(savedAppointment);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email xác nhận lịch hẹn: {}", e.getMessage(), e);
            // Không throw exception để không ảnh hưởng đến việc xác nhận appointment
        }
        
        AppointmentResponse response = convertToResponse(savedAppointment);
        
        // Gửi cập nhật qua WebSocket để cập nhật real-time
        try {
            notificationService.sendAppointmentUpdate(response);
        } catch (Exception e) {
            log.error("Lỗi khi gửi WebSocket update cho appointment: {}", e.getMessage(), e);
            // Không throw exception để không ảnh hưởng đến việc xác nhận appointment
        }
        
        return response;
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
        
        Appointment.AppointmentStatus oldStatus = appointment.getStatus();
        appointment.setStatus(Appointment.AppointmentStatus.CANCELLED);
        appointment.setCancellationReason(reason);
        appointment.setCancelledBy(cancelledBy);
        
        Appointment savedAppointment = appointmentRepository.save(appointment);
        
        // Ghi log lịch sử hủy lịch hẹn
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));
            saveAppointmentHistory(savedAppointment, AppointmentHistory.HistoryAction.CANCELLED, 
                    oldStatus, savedAppointment.getStatus(), user, reason);
        } catch (Exception e) {
            log.error("Lỗi khi ghi log lịch sử hủy lịch hẹn: {}", e.getMessage(), e);
        }
        
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
                    // Xử lý trường hợp breakDurationMinutes null (dùng giá trị mặc định 15 phút)
                    int breakDuration = expertSchedule.getBreakDurationMinutes() != null 
                        ? expertSchedule.getBreakDurationMinutes() 
                        : 15;
                    currentTime = currentTime.plusMinutes(request.getDurationMinutes() + breakDuration);
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
        response.setStudentAvatarUrl(appointment.getStudent().getAvatarUrl());
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
    
    /**
     * Helper method để ghi log lịch sử thay đổi lịch hẹn
     */
    private void saveAppointmentHistory(Appointment appointment, 
                                       AppointmentHistory.HistoryAction action,
                                       Appointment.AppointmentStatus oldStatus,
                                       Appointment.AppointmentStatus newStatus,
                                       User changedBy,
                                       String changeReason) {
        try {
            AppointmentHistory history = new AppointmentHistory();
            history.setAppointment(appointment);
            history.setAction(action);
            history.setOldStatus(oldStatus);
            history.setNewStatus(newStatus);
            history.setChangedBy(changedBy);
            history.setChangeReason(changeReason);
            
            appointmentHistoryRepository.save(history);
            log.debug("Đã ghi log lịch sử thay đổi lịch hẹn {}: {} từ {} sang {}", 
                    appointment.getId(), action, oldStatus, newStatus);
        } catch (Exception e) {
            log.error("Lỗi khi ghi log lịch sử thay đổi lịch hẹn: {}", e.getMessage(), e);
            // Không throw exception để không ảnh hưởng đến flow chính
        }
    }
}
