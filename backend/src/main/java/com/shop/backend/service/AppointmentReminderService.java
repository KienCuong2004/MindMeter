package com.shop.backend.service;

import com.shop.backend.model.Appointment;
import com.shop.backend.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentReminderService {
    
    private final AppointmentRepository appointmentRepository;
    private final EmailNotificationService emailNotificationService;
    private final SmsService smsService;
    private final NotificationService notificationService;
    
    /**
     * Send reminders 24 hours before appointment
     * Runs every hour
     */
    @Scheduled(cron = "0 0 * * * ?") // Every hour at minute 0
    public void send24HourReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime targetTime = now.plusHours(24);
        LocalDateTime startTime = targetTime.minusMinutes(30);
        LocalDateTime endTime = targetTime.plusMinutes(30);
        
        List<Appointment> appointments = appointmentRepository.findUpcomingAppointments(
            startTime, 
            endTime, 
            Appointment.AppointmentStatus.CONFIRMED
        );
        
        for (Appointment appointment : appointments) {
            try {
                // Send email reminder
                emailNotificationService.sendAppointmentReminderEmail(appointment, 24);
                
                // Send SMS reminder
                smsService.sendAppointmentReminder(appointment, 24);
                
                // Send WebSocket notification
                notificationService.sendAppointmentNotification(
                    appointment.getStudent().getId(),
                    String.format("Nhắc nhở: Bạn có lịch hẹn sau 24 giờ với %s", 
                        appointment.getExpert().getFullName())
                );
                
                log.info("24-hour reminder sent for appointment {}", appointment.getId());
            } catch (Exception e) {
                log.error("Failed to send 24-hour reminder for appointment {}: {}", 
                    appointment.getId(), e.getMessage(), e);
            }
        }
    }
    
    /**
     * Send reminders 1 hour before appointment
     * Runs every 15 minutes
     */
    @Scheduled(cron = "0 */15 * * * ?") // Every 15 minutes
    public void send1HourReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime targetTime = now.plusHours(1);
        LocalDateTime startTime = targetTime.minusMinutes(10);
        LocalDateTime endTime = targetTime.plusMinutes(10);
        
        List<Appointment> appointments = appointmentRepository.findUpcomingAppointments(
            startTime, 
            endTime, 
            Appointment.AppointmentStatus.CONFIRMED
        );
        
        for (Appointment appointment : appointments) {
            try {
                // Send email reminder
                emailNotificationService.sendAppointmentReminderEmail(appointment, 1);
                
                // Send SMS reminder
                smsService.sendAppointmentReminder(appointment, 1);
                
                // Send WebSocket notification
                notificationService.sendAppointmentNotification(
                    appointment.getStudent().getId(),
                    String.format("Nhắc nhở: Lịch hẹn của bạn với %s sẽ bắt đầu sau 1 giờ", 
                        appointment.getExpert().getFullName())
                );
                
                log.info("1-hour reminder sent for appointment {}", appointment.getId());
            } catch (Exception e) {
                log.error("Failed to send 1-hour reminder for appointment {}: {}", 
                    appointment.getId(), e.getMessage(), e);
            }
        }
    }
}

