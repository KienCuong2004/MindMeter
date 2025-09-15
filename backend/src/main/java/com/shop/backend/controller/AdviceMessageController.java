package com.shop.backend.controller;

import com.shop.backend.model.AdviceMessage;
import com.shop.backend.repository.AdviceMessageRepository;
import com.shop.backend.repository.UserRepository;
import com.shop.backend.dto.AdviceMessageDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/advice")
public class AdviceMessageController {
    @Autowired
    private AdviceMessageRepository adviceMessageRepository;
    @Autowired
    private UserRepository userRepository;

    // Helper: lấy userId từ token
    private Long getUserIdFromAuthentication(Authentication authentication) {
        String name = authentication.getName();
        if (name.startsWith("anonymous_")) {
            // Anonymous user: lấy theo ID
            Long userId = Long.parseLong(name.substring("anonymous_".length()));
            return userId;
        } else {
            // User thường: lấy theo email
            return userRepository.findByEmail(name.toLowerCase())
                    .orElseThrow(() -> new RuntimeException("User not found for email: " + name))
                    .getId();
        }
    }

    // Lấy danh sách lời khuyên/thông báo của học sinh (mới nhất trước)
    @GetMapping("/received")
    public ResponseEntity<?> getReceivedAdvice(Authentication authentication) {
        try {
            Long userId = getUserIdFromAuthentication(authentication);
            List<AdviceMessage> messages = adviceMessageRepository.findByReceiverIdOrderBySentAtDesc(userId);
            List<AdviceMessageDTO> dtos = messages.stream().map(msg -> {
                AdviceMessageDTO dto = new AdviceMessageDTO();
                dto.setId(msg.getId());
                dto.setMessage(msg.getMessage());
                dto.setMessageType(msg.getMessageType() != null ? msg.getMessageType().name() : null);
                dto.setRead(msg.getIsRead() != null ? msg.getIsRead() : false);
                dto.setSenderName(msg.getSender() != null ? (msg.getSender().getFirstName() + " " + msg.getSender().getLastName()) : "");
                dto.setSentAt(msg.getSentAt());
                return dto;
            }).toList();
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.status(401).body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    // Lấy số lượng thông báo chưa đọc
    @GetMapping("/unread/count")
    public ResponseEntity<Long> getUnreadAdviceCount(Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        long count = adviceMessageRepository.findByReceiverIdAndIsReadFalseOrderBySentAtDesc(userId).size();
        return ResponseEntity.ok(count);
    }

    // Đánh dấu một thông báo là đã đọc
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAdviceAsRead(@PathVariable Long id, Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        AdviceMessage msg = adviceMessageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("AdviceMessage not found"));
        if (!msg.getReceiver().getId().equals(userId)) {
            return ResponseEntity.status(403).body("Not your message");
        }
        msg.setIsRead(true);
        adviceMessageRepository.save(msg);
        return ResponseEntity.ok().build();
    }
} 