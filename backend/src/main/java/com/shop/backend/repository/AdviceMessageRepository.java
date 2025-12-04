package com.shop.backend.repository;

import com.shop.backend.model.AdviceMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AdviceMessageRepository extends JpaRepository<AdviceMessage, Long> {
    List<AdviceMessage> findByReceiverIdOrderBySentAtDesc(Long receiverId);
    List<AdviceMessage> findBySenderIdOrderBySentAtDesc(Long senderId);
    List<AdviceMessage> findByReceiverIdAndIsReadFalseOrderBySentAtDesc(Long receiverId);
    List<AdviceMessage> findBySenderIdAndReceiverIdOrderBySentAtDesc(Long senderId, Long receiverId);
    long count();
    
    // Get conversation between two users
    @Query("SELECT m FROM AdviceMessage m WHERE " +
           "(m.sender.id = :userId1 AND m.receiver.id = :userId2) OR " +
           "(m.sender.id = :userId2 AND m.receiver.id = :userId1) " +
           "ORDER BY m.sentAt ASC")
    List<AdviceMessage> findConversation(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
    
    // Get conversation summaries for a user
    // Group by otherUserId only to avoid duplicates, then get the latest message for each conversation
    @Query(value = "SELECT " +
           "  conv.otherUserId, " +
           "  conv.otherUserName, " +
           "  conv.otherUserAvatarUrl, " +
           "  latest.message as lastMessage, " +
           "  conv.lastMessageTime, " +
           "  conv.unreadCount " +
           "FROM (" +
           "  SELECT " +
           "    CASE WHEN m.sender_id = :userId THEN m.receiver_id ELSE m.sender_id END as otherUserId, " +
           "    CASE WHEN m.sender_id = :userId THEN CONCAT(r.first_name, ' ', r.last_name) " +
           "    ELSE CONCAT(s.first_name, ' ', s.last_name) END as otherUserName, " +
           "    CASE WHEN m.sender_id = :userId THEN r.avatar_url ELSE s.avatar_url END as otherUserAvatarUrl, " +
           "    MAX(m.sent_at) as lastMessageTime, " +
           "    SUM(CASE WHEN m.receiver_id = :userId AND m.is_read = false THEN 1 ELSE 0 END) as unreadCount " +
           "  FROM advice_messages m " +
           "  LEFT JOIN users s ON m.sender_id = s.id " +
           "  LEFT JOIN users r ON m.receiver_id = r.id " +
           "  WHERE m.sender_id = :userId OR m.receiver_id = :userId " +
           "  GROUP BY otherUserId, otherUserName, otherUserAvatarUrl" +
           ") as conv " +
           "LEFT JOIN advice_messages latest ON " +
           "  ((latest.sender_id = :userId AND latest.receiver_id = conv.otherUserId) OR " +
           "   (latest.sender_id = conv.otherUserId AND latest.receiver_id = :userId)) " +
           "  AND latest.sent_at = conv.lastMessageTime " +
           "  AND latest.id = (" +
           "    SELECT MAX(m3.id) FROM advice_messages m3 " +
           "    WHERE ((m3.sender_id = :userId AND m3.receiver_id = conv.otherUserId) OR " +
           "           (m3.sender_id = conv.otherUserId AND m3.receiver_id = :userId)) " +
           "      AND m3.sent_at = conv.lastMessageTime" +
           "  ) " +
           "ORDER BY conv.lastMessageTime DESC", nativeQuery = true)
    List<Object[]> findConversationSummaries(@Param("userId") Long userId);
    
    // Get unread messages in a conversation
    @Query("SELECT m FROM AdviceMessage m WHERE " +
           "((m.sender.id = :userId AND m.receiver.id = :otherUserId) OR " +
           "(m.sender.id = :otherUserId AND m.receiver.id = :userId)) " +
           "AND m.receiver.id = :userId AND m.isRead = false")
    List<AdviceMessage> findUnreadMessages(@Param("userId") Long userId, @Param("otherUserId") Long otherUserId);
    
    // Count unread messages for a user
    @Query("SELECT COUNT(m) FROM AdviceMessage m WHERE m.receiver.id = :userId AND m.isRead = false")
    long countUnreadMessages(@Param("userId") Long userId);
} 