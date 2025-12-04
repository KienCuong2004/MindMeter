package com.shop.backend.service;

import com.shop.backend.dto.MessageDTO;
import com.shop.backend.model.AdviceMessage;
import com.shop.backend.model.User;
import com.shop.backend.repository.AdviceMessageRepository;
import com.shop.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessagingService {
    
    private final AdviceMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    
    /**
     * Send message from student to expert or vice versa
     */
    @Transactional
    public AdviceMessage sendMessage(Long senderId, Long receiverId, String message, AdviceMessage.MessageType messageType) {
        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new RuntimeException("Sender not found"));
        User receiver = userRepository.findById(receiverId)
            .orElseThrow(() -> new RuntimeException("Receiver not found"));
        
        // Validate: Only allow messaging between STUDENT and EXPERT
        if (!isValidMessagingPair(sender, receiver)) {
            throw new RuntimeException("Messaging is only allowed between students and experts");
        }
        
        AdviceMessage adviceMessage = new AdviceMessage();
        adviceMessage.setSender(sender);
        adviceMessage.setReceiver(receiver);
        adviceMessage.setMessage(message);
        adviceMessage.setMessageType(messageType != null ? messageType : AdviceMessage.MessageType.GENERAL);
        adviceMessage.setIsRead(false);
        adviceMessage.setSentAt(LocalDateTime.now());
        
        adviceMessage = messageRepository.save(adviceMessage);
        
        // Send real-time notification via WebSocket
        sendMessageNotification(adviceMessage);
        
        log.info("Message sent from {} to {}", senderId, receiverId);
        return adviceMessage;
    }
    
    /**
     * Get conversation between two users
     */
    public List<AdviceMessage> getConversation(Long userId1, Long userId2) {
        return messageRepository.findConversation(userId1, userId2);
    }
    
    /**
     * Get all conversations for a user
     */
    public List<ConversationSummary> getUserConversations(Long userId) {
        List<Object[]> results = messageRepository.findConversationSummaries(userId);
        return results.stream().map(result -> {
            ConversationSummary summary = new ConversationSummary();
            summary.setOtherUserId(((Number) result[0]).longValue());
            summary.setOtherUserName((String) result[1]);
            summary.setOtherUserAvatarUrl((String) result[2]); // avatarUrl is 3rd element (index 2)
            summary.setLastMessage((String) result[3]); // lastMessage is 4th element (index 3)
            summary.setLastMessageTime(result[4] != null ? 
                ((java.sql.Timestamp) result[4]).toLocalDateTime() : null);
            summary.setUnreadCount(((Number) result[5]).longValue()); // unreadCount is 6th element (index 5)
            return summary;
        }).collect(Collectors.toList());
    }
    
    /**
     * Mark message as read
     */
    @Transactional
    public void markAsRead(Long messageId, Long userId) {
        AdviceMessage message = messageRepository.findById(messageId)
            .orElseThrow(() -> new RuntimeException("Message not found"));
        
        if (!message.getReceiver().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        message.setIsRead(true);
        messageRepository.save(message);
        
        // Notify sender that message was read
        messagingTemplate.convertAndSendToUser(
            message.getSender().getId().toString(),
            "/queue/message-read",
            messageId
        );
    }
    
    /**
     * Mark all messages in conversation as read
     */
    @Transactional
    public void markConversationAsRead(Long userId, Long otherUserId) {
        List<AdviceMessage> unreadMessages = messageRepository.findUnreadMessages(userId, otherUserId);
        for (AdviceMessage message : unreadMessages) {
            message.setIsRead(true);
        }
        messageRepository.saveAll(unreadMessages);
    }
    
    /**
     * Get unread message count for user
     */
    public long getUnreadCount(Long userId) {
        return messageRepository.countUnreadMessages(userId);
    }
    
    /**
     * Validate that messaging is allowed between two users
     */
    private boolean isValidMessagingPair(User user1, User user2) {
        com.shop.backend.model.Role role1 = user1.getRole();
        com.shop.backend.model.Role role2 = user2.getRole();
        
        // Allow messaging between STUDENT and EXPERT
        boolean isStudentExpert = 
            (role1 == com.shop.backend.model.Role.STUDENT && role2 == com.shop.backend.model.Role.EXPERT) ||
            (role1 == com.shop.backend.model.Role.EXPERT && role2 == com.shop.backend.model.Role.STUDENT);
        
        // Allow messaging between EXPERT and EXPERT (for collaboration)
        boolean isExpertExpert = 
            role1 == com.shop.backend.model.Role.EXPERT && role2 == com.shop.backend.model.Role.EXPERT;
        
        return isStudentExpert || isExpertExpert;
    }
    
    /**
     * Send real-time message notification via WebSocket
     */
    private void sendMessageNotification(AdviceMessage message) {
        // Send to receiver
        messagingTemplate.convertAndSendToUser(
            message.getReceiver().getId().toString(),
            "/queue/messages",
            createMessageDTO(message)
        );
        
        // Also send to sender for confirmation
        messagingTemplate.convertAndSendToUser(
            message.getSender().getId().toString(),
            "/queue/message-sent",
            createMessageDTO(message)
        );
    }
    
    /**
     * Create message DTO for WebSocket
     */
    private MessageDTO createMessageDTO(AdviceMessage message) {
        MessageDTO dto = new MessageDTO();
        dto.setId(message.getId());
        dto.setSenderId(message.getSender().getId());
        dto.setSenderName(message.getSender().getFullName());
        dto.setSenderAvatarUrl(message.getSender().getAvatarUrl());
        dto.setReceiverId(message.getReceiver().getId());
        dto.setReceiverName(message.getReceiver().getFullName());
        dto.setReceiverAvatarUrl(message.getReceiver().getAvatarUrl());
        dto.setMessage(message.getMessage());
        dto.setMessageType(message.getMessageType() != null ? message.getMessageType().name() : "GENERAL");
        dto.setIsRead(message.getIsRead() != null ? message.getIsRead() : false);
        dto.setSentAt(message.getSentAt());
        return dto;
    }
    
    /**
     * Conversation summary DTO
     */
    public static class ConversationSummary {
        private Long otherUserId;
        private String otherUserName;
        private String otherUserAvatarUrl;
        private String lastMessage;
        private LocalDateTime lastMessageTime;
        private Long unreadCount;
        
        // Getters and setters
        public Long getOtherUserId() { return otherUserId; }
        public void setOtherUserId(Long otherUserId) { this.otherUserId = otherUserId; }
        public String getOtherUserName() { return otherUserName; }
        public void setOtherUserName(String otherUserName) { this.otherUserName = otherUserName; }
        public String getOtherUserAvatarUrl() { return otherUserAvatarUrl; }
        public void setOtherUserAvatarUrl(String otherUserAvatarUrl) { this.otherUserAvatarUrl = otherUserAvatarUrl; }
        public String getLastMessage() { return lastMessage; }
        public void setLastMessage(String lastMessage) { this.lastMessage = lastMessage; }
        public LocalDateTime getLastMessageTime() { return lastMessageTime; }
        public void setLastMessageTime(LocalDateTime lastMessageTime) { this.lastMessageTime = lastMessageTime; }
        public Long getUnreadCount() { return unreadCount; }
        public void setUnreadCount(Long unreadCount) { this.unreadCount = unreadCount; }
    }
    
    /**
     * Convert AdviceMessage to MessageDTO
     */
    public MessageDTO convertToDTO(AdviceMessage message) {
        return createMessageDTO(message);
    }
    
    /**
     * Convert list of AdviceMessage to list of MessageDTO
     */
    public List<MessageDTO> convertToDTOList(List<AdviceMessage> messages) {
        return messages.stream()
            .map(this::createMessageDTO)
            .collect(java.util.stream.Collectors.toList());
    }
}

