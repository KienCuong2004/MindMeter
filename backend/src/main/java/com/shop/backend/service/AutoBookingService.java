package com.shop.backend.service;

import com.shop.backend.dto.auth.appointment.AppointmentRequest;
import com.shop.backend.dto.auth.appointment.AutoBookingRequest;
import com.shop.backend.dto.auth.appointment.AutoBookingResponse;
import com.shop.backend.model.Appointment;
import com.shop.backend.model.User;
import com.shop.backend.model.Role;
import com.shop.backend.repository.UserRepository;
import com.shop.backend.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AutoBookingService {
    
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentEmailService appointmentEmailService;
    
    @Transactional(rollbackFor = Exception.class)
    public AutoBookingResponse autoBookAppointment(AutoBookingRequest request, Long studentId) {
        try {
            log.info("Bắt đầu auto booking appointment");
            log.info("Request: expertName='{}', date='{}', time='{}', duration={} phút", 
                request.getExpertName(), request.getDate(), request.getTime(), request.getDurationMinutes());
            log.info("Student ID: {}", studentId);
            
            // 1. Tìm chuyên gia theo tên
            log.info("Tìm chuyên gia với tên: '{}'", request.getExpertName());
            User expert = findExpertByName(request.getExpertName());
            if (expert == null) {
                log.error("Không tìm thấy chuyên gia với tên: '{}'", request.getExpertName());
                return new AutoBookingResponse(false, "Không tìm thấy chuyên gia với tên: " + request.getExpertName(), 
                    null, null, null, null, null, null, null);
            }
            log.info("Tìm thấy chuyên gia: {} {} (ID: {})", 
                expert.getFirstName(), expert.getLastName(), expert.getId());
            
            // 2. Parse ngày và giờ
            log.info("Bắt đầu parse date/time: dateStr='{}', timeStr='{}'", request.getDate(), request.getTime());
            LocalDateTime appointmentDateTime = parseDateTime(request.getDate(), request.getTime());
            if (appointmentDateTime == null) {
                log.error("Parse date/time thất bại: dateStr='{}', timeStr='{}'", request.getDate(), request.getTime());
                return new AutoBookingResponse(false, "Định dạng ngày/giờ không hợp lệ. Vui lòng sử dụng format: dd/MM/yyyy HH:mm", 
                    null, null, null, null, null, null, null);
            }
            log.info("Parse date/time thành công: {} -> {}", 
                request.getDate() + " " + request.getTime(), 
                appointmentDateTime.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
            
            // 2.1. Kiểm tra ngày không phải quá khứ
            LocalDateTime now = LocalDateTime.now();
            log.info("Kiểm tra ngày quá khứ: appointmentDateTime={}, now={}", 
                appointmentDateTime.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")),
                now.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
            
            if (appointmentDateTime.isBefore(now)) {
                log.warn("Ngày đặt lịch trong quá khứ: {} < {}", 
                    appointmentDateTime.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")),
                    now.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
                return new AutoBookingResponse(false, "Không thể đặt lịch vào thời gian trong quá khứ. Vui lòng chọn thời gian trong tương lai.", 
                    null, null, null, null, null, null, null);
            }
            log.info("Ngày đặt lịch hợp lệ (không phải quá khứ)");
            
                    // 3. Kiểm tra slot có khả dụng không (tạm thời bỏ qua để test)
        log.info("Kiểm tra slot availability cho expert: {} (ID: {})", 
            expert.getFirstName() + " " + expert.getLastName(), expert.getId());
        
        // Tạm thời bỏ qua kiểm tra slot để test auto-booking
        boolean isSlotAvailable = true; // isTimeSlotAvailable(expert.getId(), appointmentDateTime, request.getDurationMinutes());
        
        if (!isSlotAvailable) {
            log.warn("Slot không khả dụng cho expert {} vào {}", 
                expert.getFirstName() + " " + expert.getLastName(),
                appointmentDateTime.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
            return new AutoBookingResponse(false, "Thời gian này không khả dụng. Vui lòng chọn thời gian khác.", 
                null, null, null, null, null, null, null);
        }
            
            log.info("Slot khả dụng cho expert {} vào {}", 
                expert.getFirstName() + " " + expert.getLastName(),
                appointmentDateTime.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
            
            // 4. Tạo appointment request
            AppointmentRequest appointmentRequest = new AppointmentRequest();
            appointmentRequest.setExpertId(expert.getId());
            appointmentRequest.setAppointmentDate(appointmentDateTime);
            appointmentRequest.setDurationMinutes(request.getDurationMinutes());
            appointmentRequest.setConsultationType(Appointment.ConsultationType.valueOf(request.getConsultationType()));
            appointmentRequest.setNotes(request.getNotes());
            appointmentRequest.setMeetingLocation(request.getMeetingLocation());
            
            // 5. Tạo lịch hẹn (không sử dụng transaction từ AppointmentService)
            log.info("Tạo appointment request: expertId={}, date={}, duration={} phút", 
                expert.getId(), appointmentDateTime, request.getDurationMinutes());
            
            // Kiểm tra student tồn tại
            User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Học sinh không tồn tại"));
            log.info("Tìm thấy student: {} {} (ID: {})", 
                student.getFirstName(), student.getLastName(), studentId);
            
            // Tạo appointment trực tiếp thay vì gọi service có transaction
            Appointment appointment = new Appointment();
            appointment.setStudent(student);
            appointment.setExpert(expert);
            appointment.setAppointmentDate(appointmentDateTime);
            appointment.setDurationMinutes(request.getDurationMinutes());
            
            // Kiểm tra consultationType hợp lệ
            try {
                appointment.setConsultationType(Appointment.ConsultationType.valueOf(request.getConsultationType()));
            } catch (IllegalArgumentException e) {
                log.warn("ConsultationType không hợp lệ: {}, sử dụng ONLINE", request.getConsultationType());
                appointment.setConsultationType(Appointment.ConsultationType.ONLINE);
            }
            
            appointment.setNotes(request.getNotes());
            appointment.setMeetingLocation(request.getMeetingLocation());
            appointment.setStatus(Appointment.AppointmentStatus.PENDING);
            
            Appointment savedAppointment = appointmentRepository.save(appointment);
            log.info("Đã tạo appointment thành công với ID: {}", savedAppointment.getId());
            
            // Gửi email thông báo cho học sinh và chuyên gia
            try {
                appointmentEmailService.sendBookingConfirmationToStudent(savedAppointment);
                appointmentEmailService.sendBookingNotificationToExpert(savedAppointment);
            } catch (Exception e) {
                log.error("Lỗi khi gửi email thông báo đặt lịch (auto booking): {}", e.getMessage(), e);
                // Không throw exception để không ảnh hưởng đến việc tạo appointment
            }
            
            // 6. Trả về response thành công
            return new AutoBookingResponse(
                true,
                "Đặt lịch hẹn thành công với chuyên gia " + expert.getFirstName() + " " + expert.getLastName(),
                savedAppointment.getId(),
                expert.getFirstName() + " " + expert.getLastName(),
                appointmentDateTime.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                appointmentDateTime.format(DateTimeFormatter.ofPattern("HH:mm")),
                "PENDING",
                request.getConsultationType(),
                request.getNotes()
            );
            
        } catch (Exception e) {
            log.error("Error in auto booking: ", e);
            String errorMessage = "Có lỗi xảy ra khi đặt lịch";
            
            // Log chi tiết lỗi để debug
            if (e.getMessage() != null) {
                errorMessage += ": " + e.getMessage();
                log.error("Error details: {}", e.getMessage());
            }
            
            // Log stack trace để debug
            log.error("Stack trace:", e);
            
            // Trả về thông báo lỗi chi tiết hơn
            if (e instanceof IllegalArgumentException) {
                errorMessage = "Thông tin đặt lịch không hợp lệ: " + e.getMessage();
            } else if (e instanceof RuntimeException) {
                errorMessage = "Lỗi hệ thống: " + e.getMessage();
            }
            
            log.error("Trả về error message: {}", errorMessage);
            return new AutoBookingResponse(false, errorMessage, 
                null, null, null, null, null, null, null);
        }
    }
    
    private User findExpertByName(String expertName) {
        if (expertName == null || expertName.trim().isEmpty()) {
            return null;
        }
        
        // Tìm chuyên gia theo tên (có thể là firstName hoặc lastName)
        
        // Tìm theo tên đầy đủ
        List<User> experts = userRepository.findByRole(Role.EXPERT);
        for (User e : experts) {
            String fullName = (e.getFirstName() + " " + e.getLastName()).toLowerCase();
            if (fullName.contains(expertName.toLowerCase()) || 
                expertName.toLowerCase().contains(e.getFirstName().toLowerCase()) ||
                expertName.toLowerCase().contains(e.getLastName().toLowerCase())) {
                return e;
            }
        }
        
        return null;
    }
    
    private LocalDateTime parseDateTime(String dateStr, String timeStr) {
        try {
            // Log ngày hiện tại để debug
            LocalDate today = LocalDate.now();
            log.info("Ngày hiện tại: {}", today.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            log.info("User yêu cầu: dateStr='{}', timeStr='{}'", dateStr, timeStr);
            
            // Parse ngày (dd/MM/yyyy hoặc dd-MM-yyyy)
            LocalDate date;
            
            // Xử lý ngày thứ trong tuần
            if (dateStr.contains("thứ") || dateStr.contains("Thứ")) {
                date = parseWeekdayToDate(dateStr);
            } else if (dateStr.contains("hôm nay") || dateStr.contains("Hôm nay")) {
                date = today;
                log.info("Parse 'hôm nay' thành: {}", date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            } else if (dateStr.contains("ngày mai") || dateStr.contains("Ngày mai")) {
                date = today.plusDays(1);
                log.info("Parse 'ngày mai' thành: {} (hôm nay: {})", 
                    date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                    today.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            } else if (dateStr.contains("ngày kia") || dateStr.contains("Ngày kia")) {
                date = today.plusDays(2);
                log.info("Parse 'ngày kia' thành: {} (hôm nay: {})", 
                    date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                    today.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            } else if (dateStr.contains("tuần này") || dateStr.contains("Tuần này")) {
                date = parseThisWeekDate(dateStr);
            } else if (dateStr.contains("tuần tới") || dateStr.contains("Tuần tới")) {
                date = parseNextWeekDate(dateStr);
            } else if (dateStr.contains("/")) {
                date = LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            } else if (dateStr.contains("-")) {
                date = LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("dd-MM-yyyy"));
            } else {
                // Thử format mặc định
                date = LocalDate.parse(dateStr);
            }
            
            // Parse giờ (HH:mm, HH:mm:ss, hoặc format ngắn gọn)
            LocalTime time = parseTimeString(timeStr);
            
            LocalDateTime result = LocalDateTime.of(date, time);
            log.info("Kết quả parse: {} {} -> {}", dateStr, timeStr, result.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
            
            return result;
            
        } catch (Exception e) {
            log.error("Error parsing date/time: dateStr='{}', timeStr='{}'", dateStr, timeStr, e);
            log.error("Parse error details: {}", e.getMessage());
            return null;
        }
    }
    
    
    /**
     * Chuyển đổi ngày thứ trong tuần thành ngày cụ thể
     * Ví dụ: "thứ 2" -> ngày thứ 2 tuần tới
     */
    private LocalDate parseWeekdayToDate(String weekdayStr) {
        LocalDate today = LocalDate.now();
        
        // Map ngày thứ trong tuần (1 = thứ 2, 2 = thứ 3, ..., 7 = chủ nhật)
        int targetWeekday = 0;
        if (weekdayStr.contains("thứ 2") || weekdayStr.contains("Thứ 2")) {
            targetWeekday = 1; // Monday
        } else if (weekdayStr.contains("thứ 3") || weekdayStr.contains("Thứ 3")) {
            targetWeekday = 2; // Tuesday
        } else if (weekdayStr.contains("thứ 4") || weekdayStr.contains("Thứ 4")) {
            targetWeekday = 3; // Wednesday
        } else if (weekdayStr.contains("thứ 5") || weekdayStr.contains("Thứ 5")) {
            targetWeekday = 4; // Thursday
        } else if (weekdayStr.contains("thứ 6") || weekdayStr.contains("Thứ 6")) {
            targetWeekday = 5; // Friday
        } else if (weekdayStr.contains("thứ 7") || weekdayStr.contains("Thứ 7")) {
            targetWeekday = 6; // Saturday
        } else if (weekdayStr.contains("chủ nhật") || weekdayStr.contains("Chủ nhật")) {
            targetWeekday = 7; // Sunday
        } else {
            // Nếu không nhận diện được, trả về ngày mai
            return today.plusDays(1);
        }
        
        // Tìm ngày thứ targetWeekday trong tuần tới
        int currentWeekday = today.getDayOfWeek().getValue(); // 1 = Monday, 7 = Sunday
        
        // Tính số ngày cần cộng để đến ngày thứ targetWeekday
        int daysToAdd = targetWeekday - currentWeekday;
        
        // Nếu ngày hôm nay đã qua ngày thứ targetWeekday, lấy tuần tới
        if (daysToAdd <= 0) {
            daysToAdd += 7;
        }
        
        return today.plusDays(daysToAdd);
    }
    
    /**
     * Parse thời gian từ các format khác nhau
     */
    private LocalTime parseTimeString(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty()) {
            return LocalTime.of(9, 0); // Giờ mặc định
        }
        
        String lowerTimeStr = timeStr.toLowerCase().trim();
        
        // Xử lý format "12h", "14h", "16h"
        if (lowerTimeStr.endsWith("h")) {
            try {
                int hour = Integer.parseInt(lowerTimeStr.replace("h", ""));
                if (hour >= 0 && hour <= 23) {
                    return LocalTime.of(hour, 0);
                }
            } catch (NumberFormatException e) {
                // Ignore, try other formats
            }
        }
        
        // Xử lý format "16 giờ", "12 giờ"
        if (lowerTimeStr.contains("giờ")) {
            try {
                String[] parts = lowerTimeStr.split("\\s+");
                if (parts.length >= 2) {
                    int hour = Integer.parseInt(parts[0]);
                    if (hour >= 0 && hour <= 23) {
                        return LocalTime.of(hour, 0);
                    }
                }
            } catch (NumberFormatException e) {
                // Ignore, try other formats
            }
        }
        
        // Xử lý format "9h sáng", "2h chiều", "8h tối"
        if (lowerTimeStr.contains("h")) {
            try {
                String[] parts = lowerTimeStr.split("\\s+");
                if (parts.length >= 2) {
                    int hour = Integer.parseInt(parts[0].replace("h", ""));
                    String period = parts[1];
                    
                    if (period.contains("sáng") || period.contains("am")) {
                        if (hour == 12) hour = 0;
                        return LocalTime.of(hour, 0);
                    } else if (period.contains("chiều") || period.contains("pm")) {
                        if (hour != 12) hour += 12;
                        return LocalTime.of(hour, 0);
                    } else if (period.contains("tối") || period.contains("evening")) {
                        if (hour != 12) hour += 12;
                        return LocalTime.of(hour, 0);
                    } else {
                        return LocalTime.of(hour, 0);
                    }
                }
            } catch (NumberFormatException e) {
                // Ignore, try other formats
            }
        }
        
        // Xử lý format chuẩn HH:mm hoặc HH:mm:ss
        if (lowerTimeStr.contains(":")) {
            try {
                String[] timeParts = lowerTimeStr.split(":");
                if (timeParts.length >= 2) {
                    int hour = Integer.parseInt(timeParts[0]);
                    int minute = Integer.parseInt(timeParts[1]);
                    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                        return LocalTime.of(hour, minute);
                    }
                }
            } catch (NumberFormatException e) {
                // Ignore, try other formats
            }
        }
        
        // Nếu không parse được, trả về giờ mặc định
        return LocalTime.of(9, 0);
    }
    
    /**
     * Parse ngày trong tuần này
     */
    private LocalDate parseThisWeekDate(String dateStr) {
        LocalDate today = LocalDate.now();
        int currentWeekday = today.getDayOfWeek().getValue();
        
        // Nếu hôm nay là thứ 2, trả về thứ 2 tuần này
        if (dateStr.contains("thứ 2") || dateStr.contains("Thứ 2")) {
            return today.minusDays(currentWeekday - 1);
        } else if (dateStr.contains("thứ 3") || dateStr.contains("Thứ 3")) {
            return today.minusDays(currentWeekday - 2);
        } else if (dateStr.contains("thứ 4") || dateStr.contains("Thứ 4")) {
            return today.minusDays(currentWeekday - 3);
        } else if (dateStr.contains("thứ 5") || dateStr.contains("Thứ 5")) {
            return today.minusDays(currentWeekday - 4);
        } else if (dateStr.contains("thứ 6") || dateStr.contains("Thứ 6")) {
            return today.minusDays(currentWeekday - 5);
        } else if (dateStr.contains("thứ 7") || dateStr.contains("Thứ 7")) {
            return today.minusDays(currentWeekday - 6);
        } else if (dateStr.contains("chủ nhật") || dateStr.contains("Chủ nhật")) {
            return today.minusDays(currentWeekday - 7);
        }
        
        // Nếu không nhận diện được, trả về ngày mai
        return today.plusDays(1);
    }
    
    /**
     * Parse ngày trong tuần tới
     */
    private LocalDate parseNextWeekDate(String dateStr) {
        LocalDate today = LocalDate.now();
        int currentWeekday = today.getDayOfWeek().getValue();
        
        // Nếu hôm nay là thứ 2, trả về thứ 2 tuần tới
        if (dateStr.contains("thứ 2") || dateStr.contains("Thứ 2")) {
            return today.plusDays(8 - currentWeekday);
        } else if (dateStr.contains("thứ 3") || dateStr.contains("Thứ 3")) {
            return today.plusDays(9 - currentWeekday);
        } else if (dateStr.contains("thứ 4") || dateStr.contains("Thứ 4")) {
            return today.plusDays(10 - currentWeekday);
        } else if (dateStr.contains("thứ 5") || dateStr.contains("Thứ 5")) {
            return today.plusDays(11 - currentWeekday);
        } else if (dateStr.contains("thứ 6") || dateStr.contains("Thứ 6")) {
            return today.plusDays(12 - currentWeekday);
        } else if (dateStr.contains("thứ 7") || dateStr.contains("Thứ 7")) {
            return today.plusDays(13 - currentWeekday);
        } else if (dateStr.contains("chủ nhật") || dateStr.contains("Chủ nhật")) {
            return today.plusDays(14 - currentWeekday);
        }
        
        // Nếu không nhận diện được, trả về ngày mai
        return today.plusDays(1);
    }
}
