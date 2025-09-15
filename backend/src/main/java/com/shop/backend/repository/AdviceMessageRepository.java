package com.shop.backend.repository;

import com.shop.backend.model.AdviceMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AdviceMessageRepository extends JpaRepository<AdviceMessage, Long> {
    List<AdviceMessage> findByReceiverIdOrderBySentAtDesc(Long receiverId);
    List<AdviceMessage> findBySenderIdOrderBySentAtDesc(Long senderId);
    List<AdviceMessage> findByReceiverIdAndIsReadFalseOrderBySentAtDesc(Long receiverId);
    List<AdviceMessage> findBySenderIdAndReceiverIdOrderBySentAtDesc(Long senderId, Long receiverId);
    long count();
} 