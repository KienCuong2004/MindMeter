package com.shop.backend.service;

import com.shop.backend.dto.ContactRequest;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class ContactService {
    private final JavaMailSender mailSender;

    @Value("${contact.receiver.email}")
    private String receiverEmail;

    public ContactService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendContactEmail(ContactRequest request) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setTo(receiverEmail);
            helper.setSubject("[MindMeter] New Contact Message from " + request.getName());
            String html = String.format(
                "<div style='font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; background: #f9f9f9; padding: 24px;'>" +
                "<h2 style='color: #2563eb; margin-bottom: 16px;'>📩 New Contact Message from MindMeter</h2>" +
                "<table style='width: 100%%; margin-bottom: 16px;'>" +
                "<tr><td style='font-weight: bold; width: 120px;'>Name:</td><td>%s</td></tr>" +
                "<tr><td style='font-weight: bold;'>Email:</td><td><a href='mailto:%s' style='color: #2563eb;'>%s</a></td></tr>" +
                "<tr><td style='font-weight: bold; vertical-align: top;'>Message:</td><td style='white-space: pre-line;'>%s</td></tr>" +
                "</table>" +
                "<div style='font-size: 13px; color: #888; border-top: 1px solid #e0e0e0; padding-top: 12px;'>" +
                "This message was sent from the MindMeter contact form.<br>" +
                "<a href='https://mindmeter.com' style='color: #2563eb;'>Visit MindMeter</a>" +
                "</div></div>",
                escapeHtml(request.getName()),
                escapeHtml(request.getEmail()),
                escapeHtml(request.getEmail()),
                escapeHtml(request.getMessage())
            );
            helper.setText(html, true);
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send contact email: " + e.getMessage(), e);
        }
    }

    // Helper để escape HTML đơn giản
    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\"", "&quot;")
                    .replace("'", "&#39;")
                    .replace("\n", "<br>");
    }
} 