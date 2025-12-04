package com.shop.backend.service;

import com.shop.backend.model.Appointment;
import com.shop.backend.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmsService {
    
    @Value("${app.sms.enabled:false}")
    private boolean smsEnabled;
    
    @Value("${app.sms.provider:twilio}")
    private String smsProvider;
    
    @Value("${app.sms.twilio.account-sid:}")
    private String twilioAccountSid;
    
    @Value("${app.sms.twilio.auth-token:}")
    private String twilioAuthToken;
    
    @Value("${app.sms.twilio.from-number:}")
    private String twilioFromNumber;
    
    /**
     * Send SMS reminder for appointment
     */
    public void sendAppointmentReminder(Appointment appointment, int hoursBefore) {
        if (!smsEnabled) {
            log.info("SMS service is disabled. Skipping SMS reminder.");
            return;
        }
        
        User student = appointment.getStudent();
        if (student.getPhone() == null || student.getPhone().isEmpty()) {
            log.warn("Student {} does not have a phone number", student.getEmail());
            return;
        }
        
        String message = generateAppointmentReminderMessage(appointment, hoursBefore);
        
        try {
            sendSms(student.getPhone(), message);
            log.info("SMS reminder sent to {} for appointment {}", student.getPhone(), appointment.getId());
        } catch (Exception e) {
            log.error("Failed to send SMS reminder: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Send SMS notification
     */
    public void sendSms(String phoneNumber, String message) {
        if (!smsEnabled) {
            log.info("SMS service is disabled");
            return;
        }
        
        switch (smsProvider.toLowerCase()) {
            case "twilio":
                sendViaTwilio(phoneNumber, message);
                break;
            case "mock":
                sendViaMock(phoneNumber, message);
                break;
            default:
                log.warn("Unknown SMS provider: {}", smsProvider);
        }
    }
    
    /**
     * Send SMS via Twilio
     * Note: Requires Twilio SDK dependency and configuration
     */
    private void sendViaTwilio(String phoneNumber, String message) {
        // For now, log the message (Twilio integration requires Twilio SDK)
        log.info("SMS via Twilio to {}: {}", phoneNumber, message);
        
        // Example Twilio implementation (requires Twilio SDK):
        /*
        try {
            Twilio.init(twilioAccountSid, twilioAuthToken);
            Message twilioMessage = Message.creator(
                new PhoneNumber(phoneNumber),
                new PhoneNumber(twilioFromNumber),
                message
            ).create();
            log.info("Twilio SMS sent: {}", twilioMessage.getSid());
        } catch (Exception e) {
            log.error("Twilio SMS failed: {}", e.getMessage(), e);
            throw e;
        }
        */
    }
    
    /**
     * Mock SMS sender for development/testing
     */
    private void sendViaMock(String phoneNumber, String message) {
        log.info("MOCK SMS to {}: {}", phoneNumber, message);
        // In development, just log the message
    }
    
    /**
     * Generate appointment reminder message
     */
    private String generateAppointmentReminderMessage(Appointment appointment, int hoursBefore) {
        User expert = appointment.getExpert();
        String expertName = expert.getFirstName() + " " + expert.getLastName();
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy", Locale.forLanguageTag("vi-VN"));
        String appointmentTime = appointment.getAppointmentDate().format(formatter);
        
        String message;
        if (hoursBefore == 24) {
            message = String.format(
                "MindMeter: Nhắc nhở! Bạn có lịch hẹn với %s vào %s. Vui lòng chuẩn bị sẵn sàng.",
                expertName,
                appointmentTime
            );
        } else if (hoursBefore == 1) {
            message = String.format(
                "MindMeter: Lịch hẹn của bạn với %s sẽ bắt đầu sau 1 giờ (%s). Vui lòng chuẩn bị!",
                expertName,
                appointmentTime
            );
        } else {
            message = String.format(
                "MindMeter: Nhắc nhở! Bạn có lịch hẹn với %s vào %s (còn %d giờ).",
                expertName,
                appointmentTime,
                hoursBefore
            );
        }
        
        return message;
    }
}

