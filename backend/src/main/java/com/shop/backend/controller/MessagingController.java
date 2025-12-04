package com.shop.backend.controller;

import com.shop.backend.dto.MessageDTO;
import com.shop.backend.repository.UserRepository;
import com.shop.backend.service.MessagingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messaging")
@RequiredArgsConstructor
public class MessagingController {
    
    private final UserRepository userRepository;
    
    private final MessagingService messagingService;
    
    /**
     * Send a message
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        try {
            Long senderId = getUserIdFromAuth(authentication);
            Long receiverId = Long.parseLong(request.get("receiverId").toString());
            String message = request.get("message").toString();
            String messageTypeStr = request.getOrDefault("messageType", "GENERAL").toString();
            
            com.shop.backend.model.AdviceMessage.MessageType messageType = 
                com.shop.backend.model.AdviceMessage.MessageType.valueOf(messageTypeStr);
            
            com.shop.backend.model.AdviceMessage sentMessage = messagingService.sendMessage(senderId, receiverId, message, messageType);
            MessageDTO messageDTO = messagingService.convertToDTO(sentMessage);
            return ResponseEntity.ok(messageDTO);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
    
    /**
     * Get conversation between current user and another user
     */
    @GetMapping("/conversation/{otherUserId}")
    public ResponseEntity<?> getConversation(
            @PathVariable Long otherUserId,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            List<com.shop.backend.model.AdviceMessage> conversation = messagingService.getConversation(userId, otherUserId);
            List<MessageDTO> conversationDTOs = messagingService.convertToDTOList(conversation);
            return ResponseEntity.ok(conversationDTOs);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
    
    /**
     * Get all conversations for current user
     */
    @GetMapping("/conversations")
    public ResponseEntity<?> getConversations(Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            List<MessagingService.ConversationSummary> conversations = 
                messagingService.getUserConversations(userId);
            return ResponseEntity.ok(conversations);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
    
    /**
     * Mark message as read
     */
    @PutMapping("/message/{messageId}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long messageId,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            messagingService.markAsRead(messageId, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
    
    /**
     * Mark conversation as read
     */
    @PutMapping("/conversation/{otherUserId}/read")
    public ResponseEntity<?> markConversationAsRead(
            @PathVariable Long otherUserId,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            messagingService.markConversationAsRead(userId, otherUserId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
    
    /**
     * Get unread message count
     */
    @GetMapping("/unread/count")
    public ResponseEntity<?> getUnreadCount(Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            long count = messagingService.getUnreadCount(userId);
            return ResponseEntity.ok("{\"count\": " + count + "}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
    
    /**
     * Helper to get user ID from authentication
     */
    private Long getUserIdFromAuth(Authentication authentication) {
        // This should match the implementation in other controllers
        String name = authentication.getName();
        if (name.startsWith("anonymous_")) {
            return Long.parseLong(name.substring("anonymous_".length()));
        } else {
            return userRepository.findByEmail(name.toLowerCase())
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
        }
    }
}

